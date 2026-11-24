"""
Retro computer (late 80s desktop, aged beige plastic) for the CV site.

Run from the project root, after blender/make_textures.py:
  /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/retro_computer.py

Environment variables:
  FAST=1        small bake textures and few samples, for quick checks
  NO_RENDER=1   skip the preview renders

Outputs:
  blender/retro_computer.blend        editable source (procedural materials, before baking)
  public/models/retro-computer.glb    model for the website (baked textures)
  blender/previews/*.png              preview renders

Mesh names used by the website: Monitor, Screen, Base, Keyboard, Keys, Leds, Cable.
Scale is real world metres.
"""

import json
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BL = os.path.join(ROOT, "blender")
TEX = os.path.join(BL, "textures")
BUILD = os.path.join(BL, "build")
PREVIEWS = os.path.join(BL, "previews")
GLB_PATH = os.path.join(ROOT, "public", "models", "retro-computer.glb")
BLEND_PATH = os.path.join(BL, "retro_computer.blend")

FAST = os.environ.get("FAST") == "1"
NO_RENDER = os.environ.get("NO_RENDER") == "1"

os.makedirs(BUILD, exist_ok=True)
os.makedirs(PREVIEWS, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"

# GPU if possible.
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception as exc:  # noqa: BLE001
    print("GPU not available, using CPU:", exc)
scene.render.engine = "CYCLES"


# ---------------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------------

def load(path, non_color=False):
    img = bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = "Non-Color"
    return img


PLASTIC_COL = load(os.path.join(TEX, "Plastic010_2K-JPG", "Plastic010_2K-JPG_Color.jpg"))
PLASTIC_RGH = load(os.path.join(TEX, "Plastic010_2K-JPG", "Plastic010_2K-JPG_Roughness.jpg"), True)
PLASTIC_NRM = load(os.path.join(TEX, "Plastic010_2K-JPG", "Plastic010_2K-JPG_NormalGL.jpg"), True)
IMPERF_COL = load(os.path.join(TEX, "SurfaceImperfections003_1K-JPG", "SurfaceImperfections003_1K-JPG_Color.jpg"), True)
FINGER_MASK = load(os.path.join(TEX, "Fingerprints002_1K-JPG", "Fingerprints002_1K-JPG_Opacity.jpg"), True)
KEY_ATLAS = load(os.path.join(BUILD, "keycaps.png"))
SCREEN_IMG = load(os.path.join(BUILD, "screen.png"))


class Graph:
    """Tiny helper around a material node tree."""

    def __init__(self, name):
        self.mat = bpy.data.materials.new(name)
        try:
            self.mat.use_nodes = True
        except Exception:  # noqa: BLE001
            pass
        self.nt = self.mat.node_tree
        self.bsdf = self.nt.nodes["Principled BSDF"]

    def node(self, kind, **props):
        n = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def box_image(self, image, vector):
        n = self.node("ShaderNodeTexImage", image=image, projection="BOX", projection_blend=0.3)
        self.link(vector, n.inputs["Vector"])
        return n

    def mapping(self, scale, offset=(0, 0, 0)):
        tc = self.node("ShaderNodeTexCoord")
        mp = self.node("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (scale, scale, scale)
        mp.inputs["Location"].default_value = offset
        self.link(tc.outputs["Object"], mp.inputs["Vector"])
        return mp.outputs["Vector"]

    def mix(self, blend, fac, a, b):
        n = self.node("ShaderNodeMixRGB", blend_type=blend)
        for sock, val in ((n.inputs["Factor"], fac), (n.inputs["Color1"], a), (n.inputs["Color2"], b)):
            if isinstance(val, bpy.types.NodeSocket):
                self.link(val, sock)
            else:
                sock.default_value = val
        return n.outputs["Color"]


def aged_plastic(name, tint, rough=(0.42, 0.62), yellow=0.35, dirt=0.22, prints=0.5, bump=0.35):
    """Beige computer plastic: texture grain, uneven yellowing, dirt and fingerprints."""
    g = Graph(name)
    uv = g.mapping(4.5)
    uv_dirt = g.mapping(1.6, (0.37, 0.11, 0.73))
    uv_prints = g.mapping(2.6, (0.5, 0.2, 0.1))

    col = g.box_image(PLASTIC_COL, uv)
    rgh = g.box_image(PLASTIC_RGH, uv)
    nrm = g.box_image(PLASTIC_NRM, uv)
    imp = g.box_image(IMPERF_COL, uv_dirt)
    fp = g.box_image(FINGER_MASK, uv_prints)

    base = g.mix("MULTIPLY", 1.0, col.outputs["Color"], (*tint, 1))

    # Yellowing: large soft blotches, stronger on surfaces that face up (sun and age).
    noise = g.node("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 3.0
    g.link(g.mapping(1.0), noise.inputs["Vector"])
    ramp = g.node("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[1].position = 0.75
    g.link(noise.outputs["Fac"], ramp.inputs["Fac"])
    geo = g.node("ShaderNodeNewGeometry")
    sep = g.node("ShaderNodeSeparateXYZ")
    g.link(geo.outputs["Normal"], sep.inputs["Vector"])
    up = g.node("ShaderNodeMath", operation="MULTIPLY_ADD")
    g.link(sep.outputs["Z"], up.inputs[0])
    up.inputs[1].default_value = 0.35
    up.inputs[2].default_value = 0.65
    amount = g.node("ShaderNodeMath", operation="MULTIPLY", use_clamp=True)
    g.link(ramp.outputs["Color"], amount.inputs[0])
    g.link(up.outputs["Value"], amount.inputs[1])
    amount2 = g.node("ShaderNodeMath", operation="MULTIPLY")
    g.link(amount.outputs["Value"], amount2.inputs[0])
    amount2.inputs[1].default_value = yellow
    yellowed = g.mix("MULTIPLY", 1.0, base, (0.93, 0.80, 0.55, 1))
    aged = g.mix("MIX", amount2.outputs["Value"], base, yellowed)

    # Dirt from the imperfection scan, kept subtle.
    dirty = g.mix("MULTIPLY", dirt, aged, imp.outputs["Color"])
    g.link(dirty, g.bsdf.inputs["Base Color"])

    # Roughness: plastic scan remapped, fingerprints are a bit glossier.
    rmap = g.node("ShaderNodeMapRange")
    rmap.inputs["To Min"].default_value = rough[0]
    rmap.inputs["To Max"].default_value = rough[1]
    g.link(rgh.outputs["Color"], rmap.inputs["Value"])
    fpm = g.node("ShaderNodeMath", operation="MULTIPLY")
    g.link(fp.outputs["Color"], fpm.inputs[0])
    fpm.inputs[1].default_value = prints * 0.35
    rfinal = g.node("ShaderNodeMath", operation="SUBTRACT", use_clamp=True)
    g.link(rmap.outputs["Result"], rfinal.inputs[0])
    g.link(fpm.outputs["Value"], rfinal.inputs[1])
    g.link(rfinal.outputs["Value"], g.bsdf.inputs["Roughness"])

    nmap = g.node("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = bump
    g.link(nrm.outputs["Color"], nmap.inputs["Color"])
    # Injection moulded plastic has a fine stipple ("VDI" texture). Adds the matte look.
    stipple = g.node("ShaderNodeTexNoise")
    stipple.inputs["Scale"].default_value = 900.0
    stipple.inputs["Detail"].default_value = 1.0
    g.link(g.mapping(1.0), stipple.inputs["Vector"])
    bmp = g.node("ShaderNodeBump")
    bmp.inputs["Strength"].default_value = 0.12
    bmp.inputs["Distance"].default_value = 0.0004
    g.link(stipple.outputs["Fac"], bmp.inputs["Height"])
    g.link(nmap.outputs["Normal"], bmp.inputs["Normal"])
    g.link(bmp.outputs["Normal"], g.bsdf.inputs["Normal"])
    g.bsdf.inputs["Specular IOR Level"].default_value = 0.42
    return g.mat


def flat(name, color, roughness, metallic=0.0, emission=None, strength=0.0):
    g = Graph(name)
    g.bsdf.inputs["Base Color"].default_value = (*color, 1)
    g.bsdf.inputs["Roughness"].default_value = roughness
    g.bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        g.bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        g.bsdf.inputs["Emission Strength"].default_value = strength
    return g.mat


BEIGE = aged_plastic("Beige", (0.80, 0.79, 0.75), rough=(0.5, 0.66), yellow=0.18, dirt=0.14, bump=0.18)
BEZEL = aged_plastic("Bezel", (0.76, 0.75, 0.71), rough=(0.48, 0.64), yellow=0.2, dirt=0.2, bump=0.18)
GREY = aged_plastic("Grey", (0.58, 0.58, 0.56), rough=(0.5, 0.7), yellow=0.1, dirt=0.35, prints=0.3)
DARK = flat("DarkPlastic", (0.025, 0.024, 0.022), 0.55)
RUBBER = flat("Rubber", (0.03, 0.03, 0.03), 0.85)
INK = flat("Ink", (0.16, 0.16, 0.17), 0.5)
MASK = flat("TubeMask", (0.045, 0.045, 0.047), 0.62)
IR_WINDOW = flat("IrWindow", (0.035, 0.008, 0.01), 0.07)
BADGE_TEXT = flat("BadgeText", (0.75, 0.73, 0.68), 0.3, metallic=0.9)
LED_GREEN = flat("LedGreen", (0.1, 0.9, 0.3), 0.2, emission=(0.2, 1.0, 0.35), strength=6)
LED_AMBER = flat("LedAmber", (1.0, 0.55, 0.1), 0.2, emission=(1.0, 0.5, 0.08), strength=3)
LED_OFF = flat("LedOff", (0.08, 0.2, 0.1), 0.15)
CABLE = flat("Cable", (0.5, 0.48, 0.44), 0.6)

# Keycaps: colours and legends come from the atlas, roughness is constant.
g = Graph("Keycaps")
tex = g.node("ShaderNodeTexImage", image=KEY_ATLAS)
g.link(tex.outputs["Color"], g.bsdf.inputs["Base Color"])
g.bsdf.inputs["Roughness"].default_value = 0.5
g.bsdf.inputs["Specular IOR Level"].default_value = 0.4
KEYCAPS = g.mat

# CRT glass: dark glass with the boot screen glowing behind it.
g = Graph("Screen")
tex = g.node("ShaderNodeTexImage", image=SCREEN_IMG)
g.link(tex.outputs["Color"], g.bsdf.inputs["Emission Color"])
g.bsdf.inputs["Emission Strength"].default_value = 2.2
g.bsdf.inputs["Base Color"].default_value = (0.012, 0.014, 0.013, 1)
g.bsdf.inputs["Roughness"].default_value = 0.06
g.bsdf.inputs["Coat Weight"].default_value = 1.0
g.bsdf.inputs["Coat Roughness"].default_value = 0.03
SCREEN = g.mat


# ---------------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------------

def link_obj(name, mesh):
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def bevel(obj, width, segments=3, angle=30):
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    mod.miter_outer = "MITER_ARC"
    return mod


def apply_all(obj):
    activate(obj)
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def box(name, size, loc, mat, bev=0.0, seg=3, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bev:
        bevel(obj, bev, seg)
    return obj


def cyl(name, r, depth, loc, mat, rot=(math.pi / 2, 0, 0), verts=40, bev=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    if bev:
        bevel(obj, bev, 2)
    return obj


def hull(name, pts, mat, bev=0.0, seg=4):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bmesh.ops.dissolve_limit(bm, angle_limit=0.001, verts=bm.verts, edges=bm.edges)
    bm.to_mesh(mesh)
    bm.free()
    obj = link_obj(name, mesh)
    obj.data.materials.append(mat)
    if bev:
        bevel(obj, bev, seg)
    return obj


def rect(cx, y, cz, w, h):
    return [(cx - w / 2, y, cz - h / 2), (cx + w / 2, y, cz - h / 2), (cx + w / 2, y, cz + h / 2), (cx - w / 2, y, cz + h / 2)]


def cut(target, cutters, mat=None):
    """Boolean-subtract cutters from target. New faces get the cutter material."""
    for c in cutters:
        if mat:
            c.data.materials.clear()
            c.data.materials.append(mat)
            if mat.name not in [m.name for m in target.data.materials if m]:
                target.data.materials.append(mat)
        c.display_type = "WIRE"
        c.hide_render = True
        mod = target.modifiers.new("Cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.object = c
        mod.material_mode = "TRANSFER"
    # Booleans must come before the bevel so the new edges get rounded too.
    bevels = [m for m in target.modifiers if m.type == "BEVEL"]
    for b in bevels:
        activate(target)
        bpy.ops.object.modifier_move_to_index(modifier=b.name, index=len(target.modifiers) - 1)
    apply_all(target)
    for c in cutters:
        bpy.data.objects.remove(c, do_unlink=True)


def text_mesh(name, body, size, loc, mat, depth=0.0006, rot=(math.pi / 2, 0, 0), font="/System/Library/Fonts/Supplemental/Arial Black.ttf"):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.data.body = body
    obj.data.size = size
    obj.data.extrude = depth
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    try:
        obj.data.font = bpy.data.fonts.load(font, check_existing=True)
    except Exception:  # noqa: BLE001
        pass
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def join(objs, name):
    for o in objs:
        apply_all(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(32))
    except Exception:  # noqa: BLE001
        bpy.ops.object.shade_flat()
    return obj


# ---------------------------------------------------------------------------------
# Base unit (desktop case). Z up, front faces -Y.
# ---------------------------------------------------------------------------------

FEET = 0.008
BW, BD = 0.42, 0.40
FRONT = -BD / 2

leds = []

chassis = box("Chassis", (BW, BD, 0.096), (0, 0, FEET + 0.048), BEIGE, bev=0.004)
cover = box("Cover", (BW + 0.004, BD + 0.002, 0.022), (0, 0.001, FEET + 0.096 + 0.0115), BEIGE, bev=0.005)
bezel = box("FrontBezel", (BW - 0.004, 0.014, 0.112), (0, FRONT - 0.006, FEET + 0.058), BEZEL, bev=0.003)

# Ventilation grooves in the front bezel (left side) and two drive bays (right side).
vent_cutters = [box(f"VentCut{i}", (0.1, 0.02, 0.0028), (-0.11, FRONT - 0.013, FEET + 0.022 + i * 0.0062), DARK) for i in range(8)]
bay_cutters = [box(f"BayCut{i}", (0.126, 0.02, 0.032), (0.105, FRONT - 0.013, FEET + z), DARK) for i, z in enumerate((0.085, 0.045))]
cut(bezel, vent_cutters + bay_cutters, DARK)

base_parts = [chassis, cover, bezel]
for i, z in enumerate((0.085, 0.045)):
    zc = FEET + z
    fy = FRONT - 0.0085
    base_parts.append(box(f"DriveFace{i}", (0.12, 0.006, 0.027), (0.105, fy, zc), GREY, bev=0.0015))
    slot_c = box(f"SlotCut{i}", (0.092, 0.02, 0.0045), (0.097, fy - 0.003, zc + 0.004), DARK)
    cut(base_parts[-1], [slot_c], DARK)
    base_parts.append(box(f"Shutter{i}", (0.086, 0.002, 0.0032), (0.097, fy + 0.001, zc + 0.004), DARK))
    base_parts.append(box(f"Eject{i}", (0.014, 0.006, 0.0065), (0.152, fy - 0.0025, zc - 0.0075), BEZEL, bev=0.0012, seg=2))
    leds.append(box(f"DriveLed{i}", (0.006, 0.003, 0.0025), (0.06, fy - 0.003, zc - 0.0078), LED_OFF if i else LED_AMBER))

# Power switch, LEDs, badge.
base_parts.append(box("PowerSwitch", (0.026, 0.01, 0.026), (-0.168, FRONT - 0.016, FEET + 0.07), GREY, bev=0.0025))
leds.append(box("PowerLed", (0.007, 0.003, 0.003), (-0.134, FRONT - 0.0135, FEET + 0.08), LED_GREEN))
leds.append(box("HddLed", (0.007, 0.003, 0.003), (-0.118, FRONT - 0.0135, FEET + 0.08), LED_OFF))
base_parts.append(box("BadgePlate", (0.07, 0.0016, 0.014), (-0.11, FRONT - 0.0135, FEET + 0.093), DARK, bev=0.0008, seg=2))
base_parts.append(text_mesh("BadgeText", "TA-86", 0.009, (-0.11, FRONT - 0.0145, FEET + 0.093), BADGE_TEXT))

# Rear: fan grille, ports, power socket.
BACK = BD / 2
base_parts.append(cyl("FanRing", 0.034, 0.004, (0.12, BACK + 0.001, FEET + 0.05), DARK, rot=(math.pi / 2, 0, 0), bev=0.001))
for i, r in enumerate((0.03, 0.022, 0.014)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.0016, location=(0.12, BACK + 0.004, FEET + 0.05), rotation=(math.pi / 2, 0, 0))
    t = bpy.context.active_object
    t.name = f"Grille{i}"
    t.data.materials.append(BEZEL)
    base_parts.append(t)
for i, (x, w) in enumerate(((-0.15, 0.04), (-0.09, 0.03), (-0.04, 0.03))):
    base_parts.append(box(f"Port{i}", (w, 0.004, 0.012), (x, BACK + 0.001, FEET + 0.045), DARK, bev=0.001))
base_parts.append(box("PowerSocket", (0.03, 0.004, 0.024), (0.04, BACK + 0.001, FEET + 0.07), DARK, bev=0.002))
for x in (-0.18, 0.18):
    for y in (-0.16, 0.16):
        base_parts.append(cyl(f"Foot{x}{y}", 0.012, FEET, (x, y, FEET / 2), RUBBER, rot=(0, 0, 0), bev=0.0015))

base = join(base_parts, "Base")
BASE_TOP = FEET + 0.096 + 0.0225


# ---------------------------------------------------------------------------------
# Monitor: compact CRT television. Rounded off-white cabinet, thick bezel,
# dark tube mask, curved glass, controls along the bottom.
# ---------------------------------------------------------------------------------


def rrect(cx, y, cz, w, h, r, n=8):
    """Points of a rounded rectangle in the XZ plane at depth y."""
    pts = []
    for qx, qz, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ox, oz = cx + qx * (w / 2 - r), cz + qz * (h / 2 - r)
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((ox + r * math.cos(a), y, oz + r * math.sin(a)))
    return pts


MON_BOTTOM = BASE_TOP + 0.006
MW, MH = 0.38, 0.375
MZ = MON_BOTTOM + MH / 2
MF = -0.17  # front face
SHELL_D = 0.085
OPEN_W, OPEN_H = 0.30, 0.226
SCREEN_ZC = MON_BOTTOM + 0.206


def at(z):
    return MON_BOTTOM + z


mon_parts = []
for x in (-0.15, 0.15):
    for y in (MF + 0.03, MF + 0.28):
        mon_parts.append(cyl(f"MonFoot{x}{y}", 0.012, 0.006, (x, y, BASE_TOP + 0.003), RUBBER, rot=(0, 0, 0), bev=0.001))

# Front shell: one moulded piece with big soft corners.
front = box("FrontShell", (MW, SHELL_D, MH), (0, MF + SHELL_D / 2, MZ), BEZEL, bev=0.026, seg=10)
apply_all(front)
bevel(front, 0.004, 3)
recess = hull(
    "RecessCut",
    rrect(0, MF - 0.012, SCREEN_ZC, OPEN_W + 0.03, OPEN_H + 0.03, 0.034) + rrect(0, MF + 0.018, SCREEN_ZC, OPEN_W, OPEN_H, 0.022)
    ,
    BEZEL,
)
tunnel = hull("TunnelCut", rrect(0, MF + 0.01, SCREEN_ZC, OPEN_W, OPEN_H, 0.022) + rrect(0, MF + 0.07, SCREEN_ZC, OPEN_W, OPEN_H, 0.022), BEZEL)
cut(front, [recess, tunnel], None)
mon_parts.append(front)

# Dark tube mask between bezel and glass.
mask = hull("TubeMask", rrect(0, MF + 0.016, SCREEN_ZC, OPEN_W + 0.006, OPEN_H + 0.006, 0.024)
            + rrect(0, MF + 0.032, SCREEN_ZC, OPEN_W + 0.006, OPEN_H + 0.006, 0.024), MASK)
mask_hole = hull("MaskHole", rrect(0, MF, SCREEN_ZC, 0.276, 0.204, 0.014) + rrect(0, MF + 0.05, SCREEN_ZC, 0.276, 0.204, 0.014), MASK)
bevel(mask, 0.0015, 2)
cut(mask, [mask_hole], None)
mon_parts.append(mask)

# Rear shell, a separate moulding: the seam between the two shells stays visible.
rear = hull(
    "RearShell",
    rrect(0, MF + SHELL_D + 0.001, MZ, MW - 0.012, MH - 0.012, 0.03)
    + rrect(0, MF + 0.2, MZ - 0.004, MW - 0.03, MH - 0.04, 0.03)
    + rrect(0, MF + 0.36, MZ - 0.02, 0.22, 0.2, 0.03),
    BEIGE,
    bev=0.008,
)
top_slots = [box(f"TopSlot{i}", (0.0042, 0.08, 0.05), (-0.11 + i * 0.02, MF + 0.16, MZ + MH / 2), DARK) for i in range(12)]
side_slots = []
for side in (-1, 1):
    for i in range(6):
        side_slots.append(box(f"SideSlot{side}{i}", (0.05, 0.065, 0.0038), (side * (MW / 2 - 0.006), MF + 0.17, MZ + 0.08 - i * 0.013), DARK))
cut(rear, top_slots + side_slots, DARK)
mon_parts.append(rear)
mon_parts.append(box("RearPlate", (0.1, 0.004, 0.05), (0, MF + 0.362, MZ - 0.04), DARK, bev=0.002))

# Printing on the front.
mon_parts.append(text_mesh("ModelName", "TA-86", 0.012, (-0.122, MF - 0.0002, at(0.343)), INK, depth=0.0002,
                           font="/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
mon_parts.append(text_mesh("Logo", "SOLDANI", 0.016, (0, MF - 0.0002, at(0.072)), INK, depth=0.0002))
for label, x, z in (("PHONES", -0.098, 0.029), ("TV/VIDEO", 0.003, 0.029), ("VOLUME", 0.055, 0.049),
                    ("CHANNEL", 0.087, 0.049), ("POWER", 0.152, 0.067)):
    mon_parts.append(text_mesh(f"Label{label}", label, 0.0042, (x, MF - 0.0002, at(z)), INK, depth=0.0001,
                               font="/System/Library/Fonts/Supplemental/Arial.ttf"))

# Controls.
mon_parts.append(cyl("PhoneJack", 0.0045, 0.003, (-0.098, MF - 0.0008, at(0.018)), DARK, verts=24, bev=0.0008))
for i, (x, z) in enumerate(((0.003, 0.018), (0.055, 0.038), (0.087, 0.038), (0.04, 0.025), (0.072, 0.025))):
    mon_parts.append(cyl(f"Button{i}", 0.0055, 0.004, (x, MF - 0.0015, at(z)), BEZEL, verts=32, bev=0.0016))
mon_parts.append(box("IrWindow", (0.034, 0.004, 0.018), (0.118, MF - 0.0008, at(0.044)), IR_WINDOW, bev=0.002))
leds.append(box("MonLed", (0.004, 0.002, 0.004), (0.107, MF - 0.0029, at(0.044)), LED_GREEN))
mon_parts.append(box("PowerFrame", (0.03, 0.004, 0.025), (0.152, MF - 0.0008, at(0.047)), BEZEL, bev=0.003))
mon_parts.append(box("PowerButton", (0.023, 0.006, 0.018), (0.152, MF - 0.0016, at(0.047)), BEIGE, bev=0.0025))

monitor = join(mon_parts, "Monitor")

# Curved CRT glass with clean 0..1 UVs, so the website can draw on it.
GW, GH, BULGE = 0.286, 0.213, 0.008
bpy.ops.mesh.primitive_grid_add(x_subdivisions=48, y_subdivisions=36, size=1, calc_uvs=True)
screen = bpy.context.active_object
screen.name = "Screen"
screen.data.name = "Screen"
for v in screen.data.vertices:
    x, y = v.co.x * GW, v.co.y * GH
    nx, ny = 2 * x / GW, 2 * y / GH
    v.co = (x, y, BULGE * (1 - 0.55 * nx * nx - 0.45 * ny * ny))
screen.rotation_euler = (math.pi / 2, 0, 0)
screen.location = (0, MF + 0.031, SCREEN_ZC)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
screen.data.materials.append(SCREEN)
bpy.ops.object.shade_smooth()


# ---------------------------------------------------------------------------------
# Keyboard
# ---------------------------------------------------------------------------------

with open(os.path.join(BUILD, "keyboard.json")) as f:
    LAYOUT = json.load(f)

U = 0.01905
KB_W, KB_D = 0.425, 0.182
KEY_UNITS = 19.5
KB_CY = -0.43
KB_FRONT, KB_BACK = KB_CY - KB_D / 2, KB_CY + KB_D / 2
H_FRONT, H_BACK = 0.021, 0.039
SLOPE = math.atan((H_BACK - H_FRONT) / KB_D)


def kb_top(y):
    return H_FRONT + (y - KB_FRONT) * math.tan(SLOPE)


KEYS_CY = KB_FRONT + 0.021 + 3.25 * U
KEY_M = Matrix.Translation((0, KEYS_CY, kb_top(KEYS_CY) - 0.006)) @ Matrix.Rotation(SLOPE, 4, "X")

case = hull(
    "KeyboardCase",
    [(-KB_W / 2, KB_FRONT, 0.004), (KB_W / 2, KB_FRONT, 0.004), (KB_W / 2, KB_BACK, 0.004), (-KB_W / 2, KB_BACK, 0.004),
     (-KB_W / 2, KB_FRONT, H_FRONT), (KB_W / 2, KB_FRONT, H_FRONT), (KB_W / 2, KB_BACK, H_BACK), (-KB_W / 2, KB_BACK, H_BACK)],
    BEIGE,
    bev=0.005,
    seg=4,
)
well = box("WellCut", (KEY_UNITS * U + 0.005, 6.5 * U + 0.005, 0.04), (0, 0, 0.02), DARK)
well.data.transform(KEY_M)
well.data.update()
cut(case, [well], DARK)

plate = box("Plate", (KEY_UNITS * U + 0.004, 6.5 * U + 0.004, 0.002), (0, 0, -0.001), DARK)
plate.data.transform(KEY_M)
kb_parts = [case, plate]
for x in (-0.17, 0.17):
    kb_parts.append(box(f"KbFoot{x}", (0.03, 0.012, 0.004), (x, KB_BACK - 0.02, 0.002), RUBBER, bev=0.001))
    kb_parts.append(box(f"KbFootF{x}", (0.03, 0.012, 0.004), (x, KB_FRONT + 0.02, 0.002), RUBBER, bev=0.001))
# Lock lights on the top right.
for i in range(3):
    pos = KEY_M @ Vector((6.6 * U + i * 0.018, 3.25 * U + 0.011, 0.0062))
    leds.append(box(f"KbLed{i}", (0.006, 0.003, 0.0012), tuple(pos), LED_GREEN if i == 1 else LED_OFF, rot=(SLOPE, 0, 0)))
kb_parts.append(text_mesh("KbBadge", "TA-86", 0.006, tuple(KEY_M @ Vector((-8.4 * U, 3.25 * U + 0.011, 0.0063))), GREY, depth=0.0003, rot=(SLOPE, 0, 0)))
keyboard = join(kb_parts, "Keyboard")

# Sculpted keycaps. Every row has its own height and angle, the top has a cylindrical dish.
ROW_PROFILE = {0: (0.0118, 9), 1: (0.0116, 7), 2: (0.0104, 3), 3: (0.0097, 0), 4: (0.0101, -5), 5: (0.0101, -7)}
CAP_BOTTOM = 0.0035
DISH = 0.00065

bm = bmesh.new()
uv_layer = bm.loops.layers.uv.new("UVMap")
for k in LAYOUT["keys"]:
    w = k["width"]
    cx, cy = k["x"] * U, k["y"] * U
    height, tilt = ROW_PROFILE[k["row"]]
    a = math.tan(math.radians(tilt))
    bw, bd = (w * U - 0.0011) / 2, (U - 0.0011) / 2
    tw, td = bw - 0.0028, bd - 0.003
    tshift = 0.0007
    nx, ny = max(6, int(6 * w)), 6
    u0, v0, u1, v1 = k["uv"]
    su, sv = k["side_uv"]

    top = [[None] * (ny + 1) for _ in range(nx + 1)]
    for i in range(nx + 1):
        for j in range(ny + 1):
            lx = -tw + 2 * tw * i / nx
            ly = -td + 2 * td * j / ny
            z = CAP_BOTTOM + height + a * ly - DISH * (1 - (lx / tw) ** 2)
            top[i][j] = bm.verts.new((cx + lx, cy + ly + tshift, z))
    top_faces = []
    for i in range(nx):
        for j in range(ny):
            f = bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
            top_faces.append((f, i, j))
    for f, i, j in top_faces:
        for loop in f.loops:
            co = loop.vert.co
            lu = (co.x - cx + tw) / (2 * tw)
            lv = (co.y - cy - tshift + td) / (2 * td)
            loop[uv_layer].uv = (u0 + (u1 - u0) * lu, v0 + (v1 - v0) * lv)

    ring = [top[i][0] for i in range(nx + 1)] + [top[nx][j] for j in range(1, ny + 1)] \
        + [top[i][ny] for i in range(nx - 1, -1, -1)] + [top[0][j] for j in range(ny - 1, 0, -1)]
    bottom = []
    for v in ring:
        lx = (v.co.x - cx) / tw
        ly = (v.co.y - cy - tshift) / td
        bottom.append(bm.verts.new((cx + lx * bw, cy + ly * bd, CAP_BOTTOM)))
    n = len(ring)
    for s in range(n):
        f = bm.faces.new((bottom[s], bottom[(s + 1) % n], ring[(s + 1) % n], ring[s]))
        for loop in f.loops:
            loop[uv_layer].uv = (su, sv)

bm.normal_update()
keys_mesh = bpy.data.meshes.new("Keys")
bm.to_mesh(keys_mesh)
bm.free()
keys = link_obj("Keys", keys_mesh)
keys.data.materials.append(KEYCAPS)
bevel(keys, 0.0008, 2, angle=28)
apply_all(keys)
keys.data.transform(KEY_M)
activate(keys)
try:
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
except Exception:  # noqa: BLE001
    pass

# Coiled-looking keyboard cable running round the left of the base to the back.
curve = bpy.data.curves.new("CableCurve", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.0024
curve.bevel_resolution = 4
curve.resolution_u = 24
spline = curve.splines.new("BEZIER")
pts = [(0.0, KB_BACK - 0.002, 0.03), (0.0, KB_BACK + 0.03, 0.0026), (-0.12, -0.265, 0.0026),
       (-0.245, -0.18, 0.0026), (-0.25, 0.08, 0.0026), (-0.19, 0.215, 0.03)]
spline.bezier_points.add(len(pts) - 1)
for bp, p in zip(spline.bezier_points, pts):
    bp.co = p
    bp.handle_left_type = bp.handle_right_type = "AUTO"
cable = link_obj("Cable", curve)
activate(cable)
bpy.ops.object.convert(target="MESH")
cable = bpy.context.active_object
cable.name = "Cable"
cable.data.materials.append(CABLE)
bpy.ops.object.shade_smooth()

leds_obj = join(leds, "Leds")

MODEL = [base, monitor, screen, keyboard, keys, leds_obj, cable]
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)


# ---------------------------------------------------------------------------------
# Preview renders (procedural materials, real lighting)
# ---------------------------------------------------------------------------------

def setup_stage():
    world = bpy.data.worlds.new("Stage")
    scene.world = world
    try:
        world.use_nodes = True
    except Exception:  # noqa: BLE001
        pass
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = load(os.path.join(TEX, "studio_small_08_1k.hdr"))
    bg_env = nt.nodes.new("ShaderNodeBackground")
    bg_env.inputs["Strength"].default_value = 0.55
    nt.links.new(env.outputs["Color"], bg_env.inputs["Color"])
    bg_dark = nt.nodes.new("ShaderNodeBackground")
    bg_dark.inputs["Color"].default_value = (0.008, 0.008, 0.009, 1)
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(bg_env.outputs["Background"], mix.inputs[1])
    nt.links.new(bg_dark.outputs["Background"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    floor = box("Floor", (6, 6, 0.01), (0, 0, -0.005), flat("FloorMat", (0.02, 0.02, 0.022), 0.35))
    floor.hide_select = True

    def light(name, kind, loc, rot, energy, color, size=1.0):
        data = bpy.data.lights.new(name, kind)
        data.energy = energy
        data.color = color
        if kind == "AREA":
            data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        obj.rotation_euler = rot
        scene.collection.objects.link(obj)
        return obj

    light("Key", "AREA", (-0.9, -1.0, 1.1), (math.radians(50), 0, math.radians(-40)), 70, (1.0, 0.92, 0.82), 0.9)
    # Green phosphor spill from the tube onto the bezel and the desk.
    spill = light("ScreenSpill", "AREA", (0, MF - 0.006, SCREEN_ZC), (math.radians(90), 0, 0), 0.7, (0.55, 1.0, 0.65), 0.26)
    spill.data.shape = "RECTANGLE"
    spill.data.size, spill.data.size_y = 0.27, 0.2
    spill.data.spread = math.radians(160)
    spill.visible_glossy = False
    spill.visible_camera = False
    light("Rim", "AREA", (0.9, 0.7, 0.8), (math.radians(65), 0, math.radians(130)), 45, (0.75, 0.85, 1.0), 0.6)

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 55
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 5.6
    cam = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam)
    target = bpy.data.objects.new("CameraTarget", None)
    scene.collection.objects.link(target)
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    cam_data.dof.focus_object = target
    scene.camera = cam
    return cam, target, floor


SHOTS = [
    ("hero", (-1.05, -1.75, 0.85), (0, -0.12, 0.24), 50),
    ("voorkant", (0.0, -2.0, 0.42), (0, -0.12, 0.27), 50),
    ("zijkant", (1.75, -0.6, 0.6), (0, -0.08, 0.24), 50),
    ("achterkant", (1.1, 1.5, 0.85), (0, 0.0, 0.26), 50),
    ("toetsenbord", (-0.2, -0.78, 0.22), (0.0, -0.41, 0.03), 50),
    ("scherm", (0.16, -0.8, 0.42), (0, -0.16, 0.33), 50),
    ("diskdrive", (0.32, -0.6, 0.18), (0.1, -0.21, 0.06), 60),
]

if not NO_RENDER:
    cam, target, floor = setup_stage()
    scene.render.resolution_x = 1600 if not FAST else 800
    scene.render.resolution_y = 1000 if not FAST else 500
    scene.cycles.samples = 160 if not FAST else 24
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    for name, loc, tgt, lens in SHOTS:
        cam.location = loc
        target.location = tgt
        cam.data.lens = lens
        scene.render.filepath = os.path.join(PREVIEWS, f"{name}.png")
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(floor, do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)


# ---------------------------------------------------------------------------------
# Bake procedural materials to textures for the web
# ---------------------------------------------------------------------------------

BAKE_SIZES = {"Base": 2048, "Monitor": 2048, "Keyboard": 1024}
if FAST:
    BAKE_SIZES = {k: 512 for k in BAKE_SIZES}


def bake_object(obj, size):
    activate(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.003, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    images = {}
    for kind, non_color in (("color", False), ("rough", True), ("normal", True), ("ao", True)):
        img = bpy.data.images.new(f"{obj.name}_{kind}", size, size)
        if non_color:
            img.colorspace_settings.name = "Non-Color"
        images[kind] = img

    nodes = []
    for slot in obj.material_slots:
        nt = slot.material.node_tree
        n = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "BakeTarget"
        nt.nodes.active = n
        nodes.append(n)

    def run(kind, bake_type, **kw):
        for n in nodes:
            n.image = images[kind]
        bpy.ops.object.bake(type=bake_type, margin=8, use_clear=True, **kw)

    scene.cycles.samples = 1
    run("color", "DIFFUSE", pass_filter={"COLOR"})
    run("rough", "ROUGHNESS")
    run("normal", "NORMAL", normal_space="TANGENT")
    scene.cycles.samples = 64 if not FAST else 8
    run("ao", "AO")

    # Fold ambient occlusion into the colour so crevices stay dark under any lighting.
    col = np.empty(size * size * 4, dtype=np.float32)
    ao = np.empty(size * size * 4, dtype=np.float32)
    images["color"].pixels.foreach_get(col)
    images["ao"].pixels.foreach_get(ao)
    col = col.reshape(-1, 4)
    ao = ao.reshape(-1, 4)[:, :1]
    col[:, :3] *= 0.4 + 0.6 * ao
    images["color"].pixels.foreach_set(col.ravel())

    for kind in ("color", "rough", "normal"):
        img = images[kind]
        img.filepath_raw = os.path.join(BUILD, f"{obj.name.lower()}_{kind}.png")
        img.file_format = "PNG"
        img.save()

    # Replace the procedural materials with one baked material (what glTF understands).
    baked = Graph(f"{obj.name}Baked")
    tc = baked.node("ShaderNodeTexImage", image=images["color"])
    tr = baked.node("ShaderNodeTexImage", image=images["rough"])
    tn = baked.node("ShaderNodeTexImage", image=images["normal"])
    nm = baked.node("ShaderNodeNormalMap")
    baked.link(tc.outputs["Color"], baked.bsdf.inputs["Base Color"])
    baked.link(tr.outputs["Color"], baked.bsdf.inputs["Roughness"])
    baked.link(tn.outputs["Color"], nm.inputs["Color"])
    baked.link(nm.outputs["Normal"], baked.bsdf.inputs["Normal"])
    baked.bsdf.inputs["Specular IOR Level"].default_value = 0.45
    obj.data.materials.clear()
    obj.data.materials.append(baked.mat)
    for p in obj.data.polygons:
        p.material_index = 0


scene.render.bake.use_selected_to_active = False
for o in (base, monitor, keyboard):
    bake_object(o, BAKE_SIZES[o.name])


# ---------------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------------

os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
for o in MODEL:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_image_format="JPEG",
    export_jpeg_quality=88,
)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(BL, "retro_computer_baked.blend"))
print("DONE", GLB_PATH, os.path.getsize(GLB_PATH) // 1024, "KB")
