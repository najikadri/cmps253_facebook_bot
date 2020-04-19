# this script/module is responsible for converting pdf files into csv files
# the csv file can be used as dataset files which will be fed to the sql generator
# note: make sure to have all the dependencies and libraries needed to run this script
from pdf_catalogue import process_pdf, FileType # from our script to read catalogue pdf
import csv
import sys
import configparser
import threading
import multiprocessing
import concurrent.futures
import time

class ConfigFile:

    def __init__(self, catalogues_file, courses_info_file):
        self.catalogues_file = f'{catalogues_file}.csv'
        self.courses_info_file = f'{courses_info_file}.csv'



def generate_courses_info (catalogues_file, courses_info_file):

    courses = {}

    with open(catalogues_file, 'r', encoding='utf-8') as input_file:

        data = csv.reader(input_file)

        data = [ row[2] for row in data if row[2] != 'link' ]

        with concurrent.futures.ProcessPoolExecutor() as executor:
            catalogues = executor.map(process_pdf, data, [FileType.ONLINE] * len(data), chunksize=5)
            for catalogue in catalogues:
                courses.update(catalogue)


    with open(courses_info_file, 'w', newline='', encoding='utf-8') as output_file:

        writer = csv.writer(output_file)

        writer.writerow(['Subject','Code','Description'])

        for course in courses.values():
            writer.writerow(course)


if __name__ == "__main__":
    # load configuration
    read_config = configparser.ConfigParser()
    read_config.read('config.ini')
    config = ConfigFile(read_config.get('settings','CataloguesFile'), read_config.get('settings', 'CourseInfoFile'))
    # generate the csv
    start = time.perf_counter()
    generate_courses_info(config.catalogues_file, config.courses_info_file)
    end = time.perf_counter()
    print(f'PDF2CSV Conversion took {round((end - start), 2)} secs')
