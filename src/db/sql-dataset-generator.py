'''
Authors: Mohammad Naji Kadri, Mazen Natour

Description: This script is designed to convert our csv files dataset which were obtained by scraping
into sql code that can be used to populate our database with data.
'''

import csv
import sys
import configparser # install configparser to read config.ini file

# define necessary classes for the sql generator

class ConfigFile:
    def __init__(self, catalog_file, attribute_file, department_faculty_file,
     tuition_file, instructors_images_file, buildings_file, course_info_file,
     catalogues_file, output_file):
        self.catalog_file = f'{catalog_file}.csv'
        self.attribute_file = f'{attribute_file}.csv'
        self.department_faculty_file = f'{department_faculty_file}.csv'
        self.tuition_file = f'{tuition_file}.csv'
        self.instructors_images_file = f'{instructors_images_file}.csv'
        self.buildings_file = f'{buildings_file}.csv'
        self.course_info_file = f'{course_info_file}.csv'
        self.catalogues_file = f'{catalogues_file}.csv'
        self.output_file = f'{output_file}.sql'

# define columns in the dataset if it might change later on

class Catalog:
    CRN = 0
    COURSE_SUBJ = 1
    COURSE_CODE = 2
    SECTION = 3
    COURSE_TITLE = 4
    TIME = 5
    DAYS = 6
    INSTRUCTOR = 7
    EMAIL = 8
    BUILDING = 9
    ROOM = 10
    YEAR = 11
    SEMESTER = 12
    CREDITS = 13

class Attribute:
    COURSE_SUBJ = 0
    COURSE_CODE = 1
    ATTRIBUTE = 2

class DepartmentFaculty:
    DEPARTMENT = 0
    FACULTY = 1


class Tuition:
    SEMESTER = 0
    YEAR = 1
    FACULTY = 2
    DEGREE_LEVEL = 3
    CREDIT_COST = 4

class InstructorsImages:
    EMAIL = 0
    SRC = 1

class Buildings:
    BUILDING = 0
    ALIAS = 1
    IMAGE = 2

class CourseInfo:
    SUBJECT = 0
    CODE = 1
    DESCRIPTION = 2

class Catalogues:
    DEPARTMENT = 0
    DEGREE_LEVEL = 1
    LINK = 2


# dictionaries to store data to be generated
courses = {}
instuctors = {}
buildings = {}
rooms = {}
lectures = {}
faculties = {}
departments = {}
tuitions = {}
catalogues = {}

# load configuration file

read_config = configparser.ConfigParser()
read_config.read('config.ini')

config = ConfigFile(
    read_config.get('settings', 'CatalogFile'),
    read_config.get('settings', 'AttributeFile'),
    read_config.get('settings', 'DepartmentFacultyFile'),
    read_config.get('settings', 'TuitionFile'),
    read_config.get('settings', 'InstructorsImagesFile'),
    read_config.get('settings', 'BuildingsFile'),
    read_config.get('settings', 'CourseInfoFile'),
    read_config.get('settings', 'CataloguesFile'),
    read_config.get('settings', 'OutputFile')
)

# read dataset and extract information

with open( config.catalog_file , 'r') as csv_file:
    data = csv.reader(csv_file)

    is_header = True 

    for row in data:

        if is_header: # ignore first row ( it is the header)
            is_header = False
            continue

        if row[Catalog.COURSE_CODE][0] == '0':
            # ignore any course/lecture which has a leading zero
            # they seem irrelavent to our required data
            continue 

        course = [row[Catalog.COURSE_SUBJ], row[Catalog.COURSE_CODE], row[Catalog.COURSE_TITLE], 'NULL', 'NULL']
        course_name = row[Catalog.COURSE_SUBJ] + str(row[Catalog.COURSE_CODE])

        instr_name = row[Catalog.INSTRUCTOR]
        email = row[Catalog.EMAIL]

        if not email in instuctors and email != 'N/A' and email != 'NULL':

            if instr_name == 'N/A' or instr_name == 'NULL':
                instuctors[email] = [f'"{email}"', 'null','null', 'null']
            else:
                first_name = instr_name.split()[0]
                last_name = ' '.join( instr_name.split()[1:])
                instuctors[email] = [f'"{email}"', f'"{ first_name }"', f'"{  last_name  }"', 'null']

        if course_name != 'NULL' and course_name != 'N/A' and not course_name in courses :
            courses[course_name] = course

        building = row[Catalog.BUILDING]

        if building != 'N/A' and building != 'NULL' and not building in buildings:
            buildings[building] = [building, 'null', 'null']

        room = row[Catalog.ROOM]

        if room != 'N/A' and room != 'NULL' and not (building + room) in rooms:
            # while len(room) < 3:
            #     room = '0' + room
            rooms[building + room] = (building, room)

        lectures[row[Catalog.CRN]] = tuple(row)


with open( config.attribute_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        course_name = row[Attribute.COURSE_SUBJ] + str(row[Attribute.COURSE_CODE])

        if course_name in courses:
            courses[course_name][-2] = row[Attribute.ATTRIBUTE]

with open( config.department_faculty_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        department = ( row[DepartmentFaculty.DEPARTMENT], row[DepartmentFaculty.FACULTY] )

        departments[ department[DepartmentFaculty.DEPARTMENT] ] = department

        faculty = department[DepartmentFaculty.FACULTY]

        if '-' in faculty:
            fac = faculty.split('-')[0]
            faculties[fac] = fac

        if not faculty in faculties:
            faculties[ faculty ] = faculty


with open( config.tuition_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        row[Tuition.YEAR] = row[Tuition.YEAR].split('-')[1]

        tuition = (row[Tuition.SEMESTER], row[Tuition.YEAR], row[Tuition.FACULTY], row[Tuition.DEGREE_LEVEL])

        if not tuition in tuitions:
            tuitions[tuition] = row


with open( config.instructors_images_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        email = row[InstructorsImages.EMAIL]

        if email in instuctors:
            instuctors[email][-1] = f'"{row[InstructorsImages.SRC]}"'

with open( config.buildings_file, 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        bldgame = row[Buildings.BUILDING]

        if bldgame in buildings:
            if row[Buildings.ALIAS] != '': # make sure that the alias is not empty
                  buildings[bldgame][Buildings.ALIAS] = f'"{row[Buildings.ALIAS]}"'
            buildings[bldgame][Buildings.IMAGE] = f'"{row[Buildings.IMAGE]}"'

with open( config.course_info_file, 'r', encoding='utf-8') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        course_name = row[CourseInfo.SUBJECT] + row [CourseInfo.CODE]

        if course_name in courses:
            courses[course_name][-1] = f'"{row[CourseInfo.DESCRIPTION]}"'


with open( config.catalogues_file , 'r') as csv_file:

    data = csv.reader(csv_file)

    is_header = True

    for row in data:

        if is_header:
            is_header = False
            continue

        dep = row[Catalogues.DEPARTMENT] + row[Catalogues.DEGREE_LEVEL]

        catalogues[dep] = row


# important functions that are used to make transcations faster
# note any sql statements between begin and end will either all be 
# inserted or none of them if there is any error or any problem

def begin (sql_file):
    sql_file.write('BEGIN; \n')

def end (sql_file):
    sql_file.write('END; \n')



# convert dataset information to sql statements

with open( config.output_file , 'w', encoding='utf-8') as sql_file:

    sql_file.write("-- facebook_data base dataset ( auto-generated )\n\n")

    sql_file.write('PRAGMA foreign_keys = ON;\n\n')


    # inserting courses

    sql_file.write('-- INSERT COURSES \n\n')

    begin(sql_file)

    for course in courses.values():

        if course[3] == 'NULL':
            course[3] = 'null'
        else:
            course[3] = f'"{course[3]}"'

        if course[4] == 'NULL':
            course[4] = 'null'
            
        sql_file.write(f'INSERT INTO course VALUES ("{course[0]}","{str(course[1])}","{course[2]}", {course[3]}, {course[4]});\n')

    end(sql_file)

    # inserting buildings

    sql_file.write('\n-- INSERT BUILDINGS \n\n')

    begin(sql_file)

    for bldg in buildings.values():
        sql_file.write(f'INSERT INTO building  VALUES ("{bldg[0]}", {bldg[1]}, {bldg[2]});\n')

    end(sql_file)

    # inserting rooms

    sql_file.write('\n-- INSERT ROOMS \n\n')

    begin(sql_file)

    for room in rooms.values():
        sql_file.write(f'INSERT INTO room  VALUES ("{room[0]}", "{room[1]}");\n')

    end(sql_file)
 
    # inserting instructors

    sql_file.write('\n-- INSERT INSTRUCTORS \n\n')

    begin(sql_file)

    for instr in instuctors.values():
        sql_file.write(f'INSERT INTO instructor (email, first_name, last_name, image_url) VALUES ({instr[0]}, {instr[1]}, {instr[2]}, {instr[3]});\n')

    end(sql_file)

    # inserting lectures

    sql_file.write('\n-- INSERT LECTURES \n\n')

    begin(sql_file)

    for lecture in lectures.values():
        # check for null values or N/A
        days = lecture[Catalog.DAYS]
        if days == 'N/A' or days == 'NULL':
            days = 'null'
        else:
            days = f'"{days}"'

        time = lecture[Catalog.TIME]
        time = time.split('-')
        if time == ['N/A'] or time == ['NULL']:
            time = ['null', 'null']
        else:
            time[0] = f'"{time[0]}"'
            time[1] = f'"{time[1]}"'

        building = lecture[Catalog.BUILDING]

        if building == 'N/A' or building == 'NULL':
            building = 'null'
        else:
            building = f'"{building}"'

        room = lecture[Catalog.ROOM]

        if room == 'N/A' or room == 'NULL':
            room = 'null'
        else:
            # while len(room) < 3:
            #     room = '0' + room

            room = f'"{room}"'

        instuctor = lecture[Catalog.INSTRUCTOR]

        email = lecture[Catalog.EMAIL]

        if email == 'N/A' or email == 'NULL':
            email = 'null'
        else:
            email = f'"{email}"'

        # if instuctor == 'N/A':
        #     instuctor = ['null','null']
        # else:
        #     first_name = instuctor.split()[0]
        #     last_name = instuctor.split()[1:]
        #     instuctor = [f'"{first_name}"', f'"{last_name}"']

        # email = lecture[EMAIL]

        

        sql_file.write(f'INSERT INTO lecture VALUES ({str(lecture[0])}, "{lecture[Catalog.SEMESTER]}", {lecture[Catalog.YEAR]}, {days}, {time[0]}, {time[1]}, "{lecture[Catalog.SECTION]}", {lecture[Catalog.CREDITS]} , "{lecture[Catalog.COURSE_SUBJ]}", "{lecture[Catalog.COURSE_CODE]}", {building}, {room}, {email});\n')

    end(sql_file)


    # inserting faculties

    sql_file.write('\n-- INSERT FACULTIES \n\n')

    begin(sql_file)

    for faculty in faculties.values():
        sql_file.write(f'INSERT INTO faculty VALUES ("{faculty}");\n')

    end(sql_file)

    # inserting departments

    sql_file.write('\n-- INSERT DEPARTMENTS \n\n')

    begin(sql_file)

    for department in departments.values():
        dep = department[ DepartmentFaculty.DEPARTMENT ]
        fac = department[ DepartmentFaculty.FACULTY ]
        sql_file.write(f'INSERT INTO department VALUES ("{dep}", "{fac}");\n')

    end(sql_file)


    # inserting tuitions

    sql_file.write('\n-- INSERT TUITION \n\n')

    begin(sql_file)

    for tuition in tuitions.values():
        sems = tuition[ Tuition.SEMESTER ]
        year = tuition[ Tuition.YEAR ]
        fac = tuition[ Tuition.FACULTY ]
        deglvl = tuition[ Tuition.DEGREE_LEVEL ]
        crd = tuition[ Tuition.CREDIT_COST ]
        sql_file.write(f'INSERT INTO tuition VALUES ("{sems}", {year}, "{fac}", "{deglvl}", "{crd}");\n')

    end(sql_file)


    # inserting catalogues

    sql_file.write('\n-- INSERT CATALOGUES \n\n')

    begin(sql_file)

    for ctlg in catalogues.values():
        sql_file.write(f'INSERT INTO catalogues VALUES ("{ctlg[Catalogues.DEPARTMENT]}", "{ctlg[Catalogues.DEGREE_LEVEL]}", "{ctlg[Catalogues.LINK]}");\n')

    end(sql_file)
    


print("facebook_bot base dataset sql successfully generated!")