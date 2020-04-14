import csv

files = ["fea"]

INSTRUCTORS_DICTIONARY = {}

def add_fea_instructors_to_dictionary(filename_):
    filename_ = "{}_instructors.txt".format(filename_)
    with open(filename_, 'r') as file_:
        lines_lst = file_.readlines()

    lines_lst = list(map(lambda s: s.strip(), lines_lst))

    for i in range(0, len(lines_lst), 6):
        name = lines_lst[i].split(', ')
        name = name[1] + " " + name[0]
        email = lines_lst[i+3]
        if email == ',':
            email = "NULL"
        Office = lines_lst[i+4]
        Building = "NULL"
        Room = "NULL"
        if Office == ",":
            Office = "NULL"
        else:
            Office = Office.split(' ')
            if len(Office) >= 2:
                Building = Office[0]
                Room = Office[1]
            else:
                Room = Office[0]
        
        Extension = lines_lst[i+5]
        if Extension == ",":
            Extension = "NULL"
        else:
            Extension = Extension.split(": ")
            Extension = Extension[1]

        
        
        INSTRUCTORS_DICTIONARY[name] = (email, Building, Room , Extension)
    return INSTRUCTORS_DICTIONARY

  
# add_instructors_to_dictionary("fea")
# with open('fea_instructors.csv', mode='w', newline = '') as f:
#     f = csv.writer(f)
#     f.writerow(('Name', "Email", "Building", "Room", "Extension" ))
#     for each in INSTRUCTORS_DICTIONARY:
#         new_lst = [each] + list(INSTRUCTORS_DICTIONARY[each])
#         new_tuple = tuple(new_lst)
#         f.writerow(new_tuple)
    