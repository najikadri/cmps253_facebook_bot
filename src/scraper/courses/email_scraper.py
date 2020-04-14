import json
from fas_instructors_formulate import add_fas_instructors_to_dictionary
from fea_instructors_formulate import add_fea_instructors_to_dictionary
FACULTIES = ["agri_full", "agri_part", "architecture", "biology", "biomed", "cee", "education", "soan", "econ",\
            "chemical", "chemistry", "cmps", "ece", "energy", "fhs","english", "media", "cvsp", "history", "geol",\
            "foodsec", "inde", "landscape", "mechanical", "nutrition", "osb", "aih", "arabic", "psych", "hpch", "anatomy"]

FACULTIES_MEMBERS = {} 
InstructorToEmail = {}
FAS_INSTRUCTORS_DICTIONARY = add_fas_instructors_to_dictionary("fas")
FEA_INSTRUCTORS_DICTIONARY = add_fea_instructors_to_dictionary("fea")


def InstructorGenerator():
    for fac in FACULTIES:
        directory = "./membersof/{}_members.json".format(fac)
        with open(directory) as f:
            data = json.load(f)


        toConvert = data[10]['_Child_Items_']


        for each in toConvert:
            Name = each['FirstName'] + " " + each['LastName']
            Email = each['Email']
            InstructorToEmail[Name] = Email
    for each in FAS_INSTRUCTORS_DICTIONARY:
        InstructorToEmail[each] = FAS_INSTRUCTORS_DICTIONARY[each][0]
    for each in FEA_INSTRUCTORS_DICTIONARY:
        InstructorToEmail[each] = FEA_INSTRUCTORS_DICTIONARY[each][0]

    # Exception for some instructors not found
    InstructorToEmail['Zoulfikar Shmayssani'] = 'zas23@mail.aub.edu'
    InstructorToEmail['Hilal Breiss'] = 'hab37@mail.aub.edu'
    InstructorToEmail['Hiyam Ghannam'] = 'hkg02@mail.aub.edu'
    InstructorToEmail['Maher Jaber'] = 'mkj02@mail.aub.edu'
    InstructorToEmail['Raphaelle Maria Akhras'] = 'rxa05@mail.aub.edu'
    InstructorToEmail['Nabil Nassif'] = 'nn12@aub.edu.lb'
    InstructorToEmail['Abbas Alhakim'] = 'aa145@aub.edu.lb'
    InstructorToEmail['Mohamed-Asem Abdul Malak'] = 'mamalak@aub.edu.lb'
    InstructorToEmail['Mohammed Al-Husseini'] = 'maa287@mail.aub.edu'
    
    return InstructorToEmail



