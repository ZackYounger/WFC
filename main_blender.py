import bpy, bmesh
import json, os


def export_selected_objects():
    basedir = "C:\\Users\\Zack\\PycharmProjects\\CourseWork\\static\\assets\\gltf"

    if not basedir:
        raise Exception("Blend file is not saved")

    view_layer = bpy.context.view_layer

    obj_active = view_layer.objects.active
    selection = bpy.context.selected_objects

    bpy.ops.object.select_all(action='DESELECT')

    for obj in selection:
        obj.select_set(True)

        # some exporters only use the active object
        view_layer.objects.active = obj

        name = bpy.path.clean_name(obj.name)
        fn = os.path.join(basedir, name)

        bpy.ops.export_scene.gltf(filepath=fn, use_selection=True)

        # Can be used for multiple formats
        # bpy.ops.export_scene.x3d(filepath=fn + ".x3d", use_selection=True)

        obj.select_set(False)

        print("written:", fn)

    view_layer.objects.active = obj_active

    for obj in selection:
        obj.select_set(True)


def rename_objs():
    for collection in bpy.data.collections:
        for index, obj in enumerate(collection.all_objects):
            obj.name = str(index)


def label_side(verts):
    # mirror the x coord across 0
    flipped_verts = flip_socket(verts)

    # iterate through every side socket created so far
    for socket in side_sockets:
        socket_verts = socket["verts"]
        # if all the verts in this socket are in the iteration socket and the lengths are the same return the iteration sockets ID
        if len(socket_verts) == len(verts) and all(vert in socket_verts for vert in verts):
            return socket["id"] + ""
        # if "" in the flipped socket  "" return  ID with a flipped sign
        if len(socket_verts) == len(flipped_verts) and all(vert in socket_verts for vert in flipped_verts):
            return socket["id"] + "f"

    # if we could not find a match we must create a new socket for this case

    # assess if the socket is symmetrical by comparing it with its flipped self
    return_data = ""
    if all(vert in flipped_verts for vert in verts):
        return_data = "s"

    # create new socket
    socket_id = "s" + str(len(side_sockets)) + "|" + return_data
    # add this new socket to the array of side sockets
    side_sockets.append(
        {
            "id": socket_id,
            "verts": verts
        }
    )
    return socket_id


def flip_socket(verts):
    # mirror the x coord across 0
    flipped_verts = [[-vert[0], vert[1]] for vert in verts]
    return flipped_verts


def label_tb(verts):
    # iterate through every rotation of the socket
    for rotation in range(4):
        # rotate the previous version by 90º
        verts = [[vert[1], -vert[0]] for vert in verts]
        # iterate through every top/bottom socket created so far
        for socket in tb_sockets:
            socket_verts = socket["verts"]
            # if all the verts in this socket are in the iteration socket and the lengths are the same
            # return the iteration sockets ID with the rotation needed to match them
            if len(socket_verts) == len(verts) and all(vert in socket_verts for vert in verts):
                return socket["id"] + str(rotation)

    # if we could not find a match we must create a new socket for this case

    # create new socket
    socket_id = "tb" + str(len(tb_sockets)) + "|"
    tb_sockets.append(
        {
            "id": socket_id,
            "verts": verts
        }
    )
    return socket_id + "0" # default rotation of 0


def do_sockets():
    global side_sockets, tb_sockets, modules
    # define sockets for faces of modules with no vertices (air)
    side_sockets = [{'id': 's666|s', 'verts': []}]
    tb_sockets = [{'id': 'tb666|', 'verts': []}]
    # define modules for air inside the "building" vs outside of it
    modules = [{
        "id": "666",
        "PosX": "s666|s",
        "NegX": "s666|s",
        "PosY": "s666|s",
        "NegY": "s666|s",
        "PosZ": "tb666|0",
        "NegZ": "tb666|0"
    }, {
        "id": "999",
        "PosX": "s999|s",
        "NegX": "s999|s",
        "PosY": "s999|s",
        "NegY": "s999|s",
        "PosZ": "tb999|0",
        "NegZ": "tb999|0"
    }] # ITERATION MOMENT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    global dirs
    dirs = ['PosX', 'PosY', 'PosZ', 'NegX', 'NegY', 'NegZ']

    # iterate through every object in the scene
    for collection in bpy.data.collections:
        for obj in collection.all_objects:

            # create a dictionary for each module
            module_data = {'id': obj.name,
                           'offset': list(obj.location),
                           'PosX': None,
                           'PosY': None,
                           'PosZ': None,
                           'NegX': None,
                           'NegY': None,
                           'NegZ': None}

            # scale and round the position of all of the vertices to remove any inaccuracies
            scale = list(obj.scale)
            transformed_verts = [vert.co for vert in obj.data.vertices]
            rounded_verts = [[round(vert[0], 2),
                              round(vert[1], 2),
                              round(vert[2], 2)] for vert in transformed_verts]

            # remove repeated vertices that may have appeared due to my blender inexperience
            final_verts = []
            [final_verts.append(vert) for vert in rounded_verts if vert not in trimmed_verts] # ITERATION MOMENT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            # check blender on pc that this is correct

            # iterate through x, y, z
            for direction in range(3):
                # iterate through the positive and negative side (outputs 1, -1)
                for side in range(1, -2, -2):
                    # select all verts that lie on the selected face
                    selected_verts = [vert for vert in final_verts if vert[direction] == side]

                    # start with [x, y, z] and remove the chosen direction
                    selected_sides = [0, 1, 2]
                    selected_sides.remove(direction)

                    # flatten the verts into 2d coordinates
                    two_d_verts = [[vert[selected_sides[0]],
                                    vert[selected_sides[1]]] for vert in selected_verts]

                    # for the x and y direction use side labelling
                    if direction == 0 or direction == 1:
                        socket_id = label_side(two_d_verts)
                    # for the z direction use top/bottom labelling
                    elif direction == 2:
                        socket_id = label_tb(two_d_verts)

                    # ask noyce about this line
                    # append the id to the module in the correct direction
                    module_data[dirs[direction + 3 * round((side + 1) / 2) - 3]] = socket_id  # super jank!

            # append the data about this module to the array of modules.
            modules.append(module_data)

    filepath = "C:/Users/zack/PycharmProjects/CourseWork/"

    # ITERATION MOMENT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    # Have to distinguish between air inside the "building" and air outside
    # Since there are few cases have chosen to do it manually
    inside_cases = [['0', ['NegZ']],
                    ['1', ['NegZ', 'PosY']],
                    ['2', ['NegZ', 'PosY', 'PosX']],
                    ['3', ['NegZ']],
                    ['4', ['NegZ']],
                    ['5', ['PosY']],
                    ['6', ['PosY', 'PosX']]
                    ]

    # iterate through every module and every case in inside_cases
    for index, module in enumerate(modules):
        for child in inside_cases:
            # if they have the same id update the air id (666) with the inside air id (999)
            if module['id'] == child[0]:
                for dir in child[1]:
                    modules[index][dir] = modules[index][dir].replace('666', '999')

#    with open(filepath + 'moduleSockets.json', 'w', encoding='utf-8') as f:
#        json.dump(modules, f, ensure_ascii=False, indent=4)
#    with open(filepath + 'sockets.json', 'w', encoding='utf-8') as f:
#        json.dump([*side_sockets, *tb_sockets], f, ensure_ascii=False, indent=4)


    print(side_sockets)


def fuckAround():
    index = 0

    obj = bpy.data.objects[index]

    scale = list(obj.scale)

    verts = []
    [verts.append([round(vert.co[0] * scale[0], 2),
                   round(vert.co[1] * scale[1], 2),
                   round(vert.co[2] * scale[2], 2)]) for vert in obj.data.vertices]

    v = []
    [v.append(vert) for vert in verts if vert not in v]
    print(v)


# fuckAround()
# findOut()


# export_selected_objects()
# rename_objs()
do_sockets()