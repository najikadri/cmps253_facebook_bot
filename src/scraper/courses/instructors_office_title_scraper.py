import csv

# 0 -> name
# 1 -> title
# 2 -> department
# 3 -> email
# 4 -> office
# 5 -> extension

def add_fas_instructors_to_dictionary(filename_):
    global INSTRUCTORS_DICTIONARY
    INSTRUCTORS_DICTIONARY = {}
    filename_ = "{}_instructors.txt".format(filename_)
    with open(filename_, 'r') as file_:
        lines_lst = file_.readlines()

    lines_lst = list(map(lambda s: s.strip(), lines_lst))

    for i in range(0, len(lines_lst), 6):
        name = lines_lst[i].split(", ")
        firstname = name[1]
        lastname = name[0]
        name = firstname + " " + lastname
        email = lines_lst[i+3]
        if email == ',':
            email = "NULL"
        Office = lines_lst[i+4]
        Building = "NULL"
        Room = "NULL"
        if Office == ",":
            Office = "NULL"
        else:
            Office = Office.split(', ')
            Building = Office[0]
            if "Physics" in Building:
                Building = "Phy"
            if "Business" in Building:
                Building = "OSB"
            Building = Building.split(" ")[0]
            if Building == "Chemistry":
                Building = "Che"
            if Building == "Biology":
                Building = "Bio"
            Room = Office[1]
        
        Extension = lines_lst[i+5]
        if Extension == ",":
            Extension = "NULL"
        else:
            Extension = Extension.split(": ")
            Extension = Extension[1]     
        title = lines_lst[i+1]
        if title == ",":
            title = "NULL"
        
        if email != "NULL":
            INSTRUCTORS_DICTIONARY[email] = (title, Building, Room)
    return INSTRUCTORS_DICTIONARY

dict_ = add_fas_instructors_to_dictionary("fas")

def make_csv(dict_):
    with open('instructors_office_title.csv', mode='w', newline = '') as f:
        f = csv.writer(f)
        f.writerow(("Email", "Title", "Building", "Room"))
        for key, value in dict_.items():
            tup = (key,)
            tup += value
            f.writerow(tup)
make_csv(dict_)
