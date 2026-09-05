"""
panther_digital_blender.py
Run with: blender --background --python panther_digital_blender.py -- --render
Or: blender --background --python panther_digital_blender.py

Generates a stylized low-poly panther, applies subdivision, exports to public/panther.glb
No manual sculpt needed - procedural. For manual 10-min sculpt: open panther.blend after generation.

Verified with Blender 4.2+ bpy API
"""
import bpy
import os
import sys
import math

# --- args ---
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--")+1:]
else:
    argv = []

do_render = "--render" in argv

# Clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# --- Materials ---
def make_material(name, color, roughness=0.6, metallic=0.15):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat

mat_black = make_material("PantherBlack", (0.04, 0.04, 0.045), 0.45, 0.1)
mat_eye = make_material("PantherEye", (0.2, 0.85, 0.5), 0.2, 0.0)
mat_eye_emission = make_material("PantherEyeEmit", (0.1, 1.0, 0.45), 1.0, 0.0)
# Add emission
mat_eye_emission.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.1, 1.0, 0.45, 1)
mat_eye_emission.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 2.5

# Helpers
def create_primitive(type_, size, location, rotation=(0,0,0), material=None):
    if type_ == 'cube':
        bpy.ops.mesh.primitive_cube_add(size=size, location=location, rotation=rotation)
    elif type_ == 'uv_sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=size/2, location=location, rotation=rotation)
    elif type_ == 'cylinder':
        bpy.ops.mesh.primitive_cylinder_add(radius=size/2, depth=size, location=location, rotation=rotation)
    elif type_ == 'cone':
        bpy.ops.mesh.primitive_cone_add(radius1=size/2, depth=size, location=location, rotation=rotation)
    obj = bpy.context.active_object
    if material:
        obj.data.materials.append(material)
    return obj

def join_objects(objs, name="Panther"):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    return joined

# --- Build panther - stylized, abstract, digital - suitable for background element ---
# Body
body = create_primitive('cube', 2.2, (0, 0, 0.6), material=mat_black)
body.scale = (1.4, 0.7, 0.55)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
# Add bevel to soften
mod_bevel = body.modifiers.new("Bevel", 'BEVEL')
mod_bevel.width = 0.15
mod_bevel.segments = 2

# Head
head = create_primitive('cube', 1.1, (1.35, 0, 0.85), material=mat_black)
head.scale = (1, 0.85, 0.85)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
mod_bevel_h = head.modifiers.new("Bevel", 'BEVEL')
mod_bevel_h.width = 0.08
mod_bevel_h.segments = 2

# Snout
snout = create_primitive('cube', 0.6, (1.95, 0, 0.65), material=mat_black)
snout.scale = (1, 0.8, 0.7)

# Ears
ear_l = create_primitive('cone', 0.35, (1.25, 0.38, 1.35), rotation=(0,0,0), material=mat_black)
ear_r = create_primitive('cone', 0.35, (1.25, -0.38, 1.35), material=mat_black)

# Legs - 4 simplified
leg_positions = [(0.7, 0.45, -0.1), (0.7, -0.45, -0.1), (-0.7, 0.45, -0.1), (-0.7, -0.45, -0.1)]
legs = []
for pos in leg_positions:
    leg = create_primitive('cylinder', 0.7, pos, material=mat_black)
    leg.scale = (0.35/0.35, 0.35/0.35, 1)  # radius already via primitive
    # scale cylinder radius via object scale
    leg.scale = (0.5, 0.5, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    legs.append(leg)

# Tail - curved via scaled cubes
tail1 = create_primitive('cylinder', 0.9, (-1.3, 0, 0.55), rotation=(0, math.radians(90), 0), material=mat_black)
tail1.scale = (0.35, 0.35, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
tail2 = create_primitive('cylinder', 0.6, (-1.75, 0.15, 0.55), rotation=(0, math.radians(90), math.radians(20)), material=mat_black)
tail2.scale = (0.28, 0.28, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Eyes
eye_l = create_primitive('uv_sphere', 0.16, (1.75, 0.28, 0.88), material=mat_eye_emission)
eye_r = create_primitive('uv_sphere', 0.16, (1.75, -0.28, 0.88), material=mat_eye_emission)

# Join main body (keep eyes separate for material)
main_parts = [body, head, snout, ear_l, ear_r] + legs + [tail1, tail2]
panther = join_objects(main_parts, "PantherBody")

# Apply subdivision surface to mimic "add subdivision" step
mod_subsurf = panther.modifiers.new("Subdivision", 'SUBSURF')
mod_subsurf.levels = 2
mod_subsurf.render_levels = 2
mod_subsurf.subdivision_type = 'CATMULL_CLARK'

# Smooth shade
bpy.ops.object.select_all(action='DESELECT')
panther.select_set(True)
bpy.context.view_layer.objects.active = panther
bpy.ops.object.shade_smooth()

for eye in [eye_l, eye_r]:
    eye.select_set(True)
    bpy.context.view_layer.objects.active = eye
    bpy.ops.object.shade_smooth()
    eye.select_set(False)

panther.select_set(True)

# Re-apply transforms
bpy.ops.object.transform_apply(location=False, rotation=False, scale=False)

# --- Lighting / Camera for optional render ---
if do_render:
    # Camera
    bpy.ops.object.camera_add(location=(4, -3.5, 2.2), rotation=(math.radians(68), 0, math.radians(58)))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    # Light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
    sun = bpy.context.active_object
    sun.data.energy = 5.0
    bpy.ops.object.light_add(type='AREA', location=(0, -3, 2))
    area = bpy.context.active_object
    area.data.energy = 150
    area.data.size = 3

    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 64
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.filepath = os.path.join(os.path.dirname(bpy.data.filepath) or os.getcwd(), "panther_render.png")
    bpy.ops.render.render(write_still=True)
    print(f"Rendered to {bpy.context.scene.render.filepath}")

# --- Save .blend ---
blend_path = os.path.join(os.getcwd(), "panther.blend")
# Also save next to script
script_dir = os.path.dirname(os.path.abspath(__file__))
blend_path2 = os.path.join(script_dir, "panther.blend")
try:
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved .blend to {blend_path}")
    if blend_path != blend_path2:
        bpy.ops.wm.save_as_mainfile(filepath=blend_path2)
        print(f"Saved .blend to {blend_path2}")
except Exception as e:
    print(f"Failed to save .blend: {e}")

# --- Export GLB ---
# Ensure directory exists
export_dir = os.path.join(script_dir, "public")
os.makedirs(export_dir, exist_ok=True)
glb_path = os.path.join(export_dir, "panther.glb")
glb_path_cwd = os.path.join(os.getcwd(), "panther.glb")

# Select all mesh objects for export
bpy.ops.object.select_all(action='SELECT')

try:
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_apply=True,  # apply modifiers (subdivision)
        export_yup=True,
    )
    print(f"Exported GLB to {glb_path} ({os.path.getsize(glb_path)} bytes)")
    # also copy to cwd if different
    if glb_path != glb_path_cwd:
        import shutil
        shutil.copy(glb_path, glb_path_cwd)
        print(f"Copied GLB to {glb_path_cwd}")
except Exception as e:
    print(f"GLB export failed: {e}")
    import traceback
    traceback.print_exc()

print("DONE. Open panther.blend in Blender GUI to sculpt for 10 min in Sculpt Mode, then re-export via File > Export > glTF 2.0 (.glb) with 'Apply Modifiers' checked.")
