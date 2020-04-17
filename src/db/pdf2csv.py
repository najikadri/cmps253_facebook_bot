# this script/module is responsible for converting pdf files into csv files
# the csv file can be used as dataset files which will be fed to the sql generator
# note: make sure to have all the dependencies and libraries needed to run this script
from pdf_catalogue import process_pdf, FileType # from our script to read catalogue pdf
import csv
import sys
import configparser

class ConfigFile:

    def __init__(self, catalogues_file, courses_info_file):
        self.catalogues_file = f'{catalogues_file}.csv'
        self.courses_info_file = f'{courses_info_file}.csv'



def generate_courses_info (catalogues_file, courses_info_file):

    with open(catalogues_file, 'r', encoding='utf-8') as input_file, open(courses_info_file, 'w', newline='', encoding='utf-8') as output_file:

        data = csv.reader(input_file)

        is_header = True

        entry = 0

        writer = csv.writer(output_file, delimiter=',')

        writer.writerow(['Subject','Code','Description'])

        for row in data:

            if is_header:
                is_header = False
                continue

            entry += 1

            link = row[2]

            print(f'Entry #{str(entry)}: ',)

            courses = process_pdf(link, FileType.ONLINE)

            for course in courses.values():
                writer.writerow(course)


if __name__ == "__main__":
    # load configuration
    read_config = configparser.ConfigParser()
    read_config.read('config.ini')
    config = ConfigFile(read_config.get('settings','CataloguesFile'), read_config.get('settings', 'CourseInfoFile'))
    # generate the csv
    generate_courses_info(config.catalogues_file, config.courses_info_file)
