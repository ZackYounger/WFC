import json

dirs = ['PosX', 'PosY', 'PosZ', 'NegX', 'NegY', 'NegZ']
cardinals = ['PosX', 'PosY', 'NegX', 'NegY']  # CHECK

with open('../moduleSockets.json', 'r') as f:
    inputData = json.load(f)


def rotateTBSockets(sockets, rotation):
    #Rotate the array of sockets facing up and down
    return [socket.split('|')[0] + "|" + str((int(socket.split('|')[1]) + rotation) % 4) + "|" + socket.split('|')[2] for socket in sockets]

def rotateCardinalSockets(sockets, rotation):
    return [socket.split('|')[0] + "|" + str((int(socket.split('|')[1]) + rotation) % 4) for socket in sockets]


def compareSockets(a, b):
    a, b = a.split('|'), b.split('|')

    # check that the main ID is the same
    if a[0] == b[0]:
        # symmetry test
        if a[1] == "s" and b[1] == "s":
            return True
        # asymmetry test
        elif a[1] == "f" and b[1] == "" or a[1] == "" and b[1] == "f":
            return True
        # top/bottom check; check rotation index is the same
        elif a[0][0:2] == "tb" and a[0][2:] == b[0][2:]:
            return True
    return False


def contructVariants(inputData):
    allModules = []
    # iterate through every module
    for module in inputData:
        #moduleData = {}
        # iterate through the 4 direction to create a module for each
        for numdir, direction in enumerate(cardinals):
            rotated_module = {}
            flipped = 0
            # assign the rotated module a new ID
            rotated_module['id'] = module['id'] + '|' + str(numdir) + '|' + str(flipped)
            # update all 4 sides of the new rotated module
            for index, cardinal in enumerate(cardinals):
                rotated_module[cardinals[index]] = module[cardinals[(index + numdir) % 4]]
                # doing the PosZ after the first rotation ensures a nice order of keys in the resulting JSON
                if index == 1:
                    rotated_module["PosZ"] = rotateTBSockets([module["PosZ"] + "|"], numdir)[0]
            rotated_module["NegZ"] = rotateTBSockets([module["NegZ"] + "|"], numdir)[0]

            # append the rotated module to the array of modules
            allModules.append(rotated_module)

            # now we flip the rotated module

            flipped_module = {}

            # assign the flipped module a new ID
            moduleID_data = rotated_module['id'].split('|')
            flipped_id = moduleID_data[0] + '|' + moduleID_data[1] + '|' + '1'
            flipped_module['id'] = flipped_id

            # inverts the flip sign on every side
            for index, cardinal in enumerate(cardinals):
                data = rotated_module[cardinal].split('|')
                if data[1] == 'f':
                    data[1] = ''
                elif data[1] == '':
                    data[1] = 'f'
                flipped_module[cardinal] = '|'.join(data)

            # doing the PosZ after the first rotation ensures a nice order of keys in the resulting JSON
            # adding the flipped tag to the top socket
            flipped_module['PosZ'] = module['PosZ'] + '|1'

            # swap the socketIDs of the left and right side
            flipped_module['PosY'], flipped_module['NegY'] = flipped_module['NegY'], flipped_module['PosY']

            # adding the flipped tag to the bottom socket
            flipped_module['NegZ'] = module['NegZ'] + '|1'

            # append the flipped version of the rotated module to the array of modules
            allModules.append(flipped_module)

    return allModules


def constructData(inputData):
    returnData = []
    # iterate through every module
    for module in inputData:
        moduleData = {}
        moduleData['id'] = module['id']
        # iterate through every direction
        for numdir, direction in enumerate(dirs):
            directionData = []
            # iterate through all module to compare with the original
            for compare_module in inputData:
                # test whether the two module can be adjacent
                passed = compareSockets(module[direction], compare_module[dirs[(numdir + 3) % 6]])
                if passed:
                    # if the modules pass then add the compare_modules ID to the allowed array
                    directionData.append(compare_module["id"])
            # add the allowed array to the dictionary under the key of the direction
            moduleData[direction] = directionData
        # add the moduleData to main data array
        returnData.append(moduleData)
    return returnData



allModules = contructVariants(inputData)

data = constructData(allModules)

#with open('adjacencyData.json', 'w', encoding='utf-8') as f:
#    json.dump(data, f, ensure_ascii=False, indent=4)

socket_data = socket.split('|')
socket_data[0] + "|" + str((int(socket_data[1]) + rotation) % 4) + "|" + socket_data[2]
