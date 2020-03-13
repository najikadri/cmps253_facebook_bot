'''
Authors: Mohammad Naji Kadri, Mazen Natour

Description: This program is designed to translate a csv file into 
a sql file by translating each operation into a sql statement.
This allows the execution of these statements and entering them into the database.
It also allows the modification of the sql file to change or add entities for testing
without changing the original csv file ( original dataset )
Note: this code is only intended for the facebook_bot database schema

Note: to run this file use sqlite3 followed by the database name in the terminal
example "sqlite3 cmps.db" and once the REPL open type .read followed by the name of the generated 
sql file example "sqlite3 > .read aub_catalog_dataset.csv"
'''

import csv
import sys

# define columns in the dataset if it might change later on

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



courses = {}
instuctors = {}
buildings = {}
rooms = {}
lectures = {}

# pass input and output file locations

inFile = 'cmps_base_dataset.csv'
outFile = 'cmps_base_dataset.sql'

if len(sys.argv) >= 2:
    inFile = sys.argv[1] 
    outFile = sys.argv[2]

# read dataset and extract information about courses and lectures

with open( inFile , 'r') as csv_file:
    data = csv.reader(csv_file)

    is_header = True 

    for row in data:

        if is_header: # ignore first row ( it is the header)
            is_header = False
            continue
        course = (row[COURSE_SUBJ], row[COURSE_CODE], row[COURSE_TITLE])
        course_name = row[COURSE_SUBJ] + str(row[COURSE_CODE])

        instr_name = row[INSTRUCTOR]
        email = row[EMAIL]

        if not email in instuctors and email != 'N/A' and email != 'NULL':

            if instr_name == 'N/A' or instr_name == 'NULL':
                instuctors[email] = (f'"{email}"', 'null','null')
            else:
                first_name = instr_name.split()[0]
                last_name = ' '.join( instr_name.split()[1:])
                instuctors[email] = (f'"{email}"', f'"{ first_name }"', f'"{  last_name  }"')

        if course_name != 'NULL' and course_name != 'N/A' and not course_name in courses :
            courses[course_name] = course

        building = row[BUILDING]

        if building != 'N/A' and building != 'NULL' and not building in buildings:
            buildings[building] = building

        room = row[ROOM]

        if room != 'N/A' and room != 'NULL' and not room in rooms:
            # while len(room) < 3:
            #     room = '0' + room
            rooms[building + room] = (building, room)

        lectures[row[CRN]] = tuple(row)


# important functions that are used to make transcations faster
# note any sql statements between begin and end will either all be 
# inserted or none of them if there is any error or any problem

def begin (sql_file):
    sql_file.write('BEGIN; \n')

def end (sql_file):
    sql_file.write('END; \n')



# convert dataset information to sql statements


with open( outFile , 'w') as sql_file:

    sql_file.write("-- facebook_data base dataset ( auto-generated )\n\n")

    sql_file.write('PRAGMA foreign_keys = ON;\n\n')


    # inserting courses

    sql_file.write('-- INSERT COURSES \n\n')

    begin(sql_file)

    for course in courses.values():
        sql_file.write(f'INSERT INTO course VALUES ("{course[0]}","{str(course[1])}","{course[2]}");\n')

    end(sql_file)

    # inserting buildings

    sql_file.write('\n-- INSERT BUILDINGS \n\n')

    begin(sql_file)

    for bldg in buildings.values():
        sql_file.write(f'INSERT INTO building  VALUES ("{bldg}");\n')

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
        sql_file.write(f'INSERT INTO instructor (email, first_name, last_name) VALUES ({instr[0]}, {instr[1]}, {instr[2]});\n')

    end(sql_file)

    # inserting lectures

    sql_file.write('\n-- INSERT LECTURES \n\n')

    begin(sql_file)

    for lecture in lectures.values():
        # check for null values or N/A
        days = lecture[DAYS]
        if days == 'N/A' or days == 'NULL':
            days = 'null'
        else:
            days = f'"{days}"'

        time = lecture[TIME]
        time = time.split('-')
        if time == ['N/A'] or time == ['NULL']:
            time = ['null', 'null']
        else:
            time[0] = f'"{time[0]}"'
            time[1] = f'"{time[1]}"'

        building = lecture[BUILDING]

        if building == 'N/A' or building == 'NULL':
            building = 'null'
        else:
            building = f'"{building}"'

        room = lecture[ROOM]

        if room == 'N/A' or room == 'NULL':
            room = 'null'
        else:
            # while len(room) < 3:
            #     room = '0' + room

            room = f'"{room}"'

        instuctor = lecture[INSTRUCTOR]

        email = lecture[EMAIL]

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

        

        sql_file.write(f'INSERT INTO lecture VALUES ({str(lecture[0])}, "{lecture[SEMESTER]}", {lecture[YEAR]}, {days}, {time[0]}, {time[1]}, "{lecture[3]}", "{lecture[1]}", "{lecture[2]}", {building}, {room}, {email});\n')

    end(sql_file)


print("facebook_bot base dataset sql successfully generated!")