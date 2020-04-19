# this script / module extract courses description for each course from the catalogue file
# it returns a list of tuples that contains the course subject, code, and description each
# which will be used by another script to build a csv file form the complete extractions
# note: for now it gets the course code and description later might add the feature to retreive course title
# note: as the developers of pdfminer said: PDF is evil ! This algorithm will extract most courses and their
# descriptions but might miss a couple of ones per catalogue file

# to use this script please make sure to download the packages pdfminer and wget

from pdfminer.pdfparser import PDFParser
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfpage import PDFTextExtractionNotAllowed
from pdfminer.pdfinterp import PDFResourceManager
from pdfminer.pdfinterp import PDFPageInterpreter
from pdfminer.pdfdevice import PDFDevice
from pdfminer.layout import LAParams
from pdfminer.converter import PDFPageAggregator
from pdfminer.pdfpage import PDFPage
from pdfminer.layout import LTTextBoxHorizontal
import wget
import urllib.error
import os
import random
import time
import multiprocessing
import concurrent.futures

class FileType:
    LOCAL = 0
    ONLINE = 1

# process a single element in layout
def process_element(element, courses):

            if isinstance(element, LTTextBoxHorizontal):
                text = element.get_text()

                # print('element: ' + text)

                if (( text[:4].isupper() and text[:4].isalpha() ) or text[0].isnumeric() ) and text.count('\n') > 1: # it means is is a course subject e.g. CMPS
                    description_index = 1 # which array index the description of the course starts in 
                    course_fullcode = []

                    if '/' in text and text[text.index('/') + 1].isnumeric(): # means in format (SUBJ CODE1 / CODE2)
                       text =  text.replace('/','/\n' + text[:4] + ' ') # becomes in format (SUBJ CODE1 / SUBJ CODE2)

                    # print('element: ' + text)

                    text = text.split('\n') # contains course name(s) and description
                    course = text[0].strip()


                    if course[0].isnumeric(): # might be a credit number like 3.0 cr.
                        text = text[1:]
                        course = text[0].strip()


                    slash_found = False
                    another_course = True

                    try: # check if the second part of the course name is starting with a digit
                        if not course.split()[1][0].isnumeric() or course.count(',') > 0:
                            return # skip if it does not start witha digit (because format is SUBJ CODE)
                    except IndexError:
                        if '/' in course: # that means it is like the format ( SUBJ1 / SUBJ2 CODE)
                            slash_found = True
                            course = course[:4] + ' ' + text[1].split()[1] + '/' # create format ( SUBJ1 CODE / SUBJ2 CODE) to work with the algorithm down below
                        else:
                            return # otherwise something is wrong and it is not a course


                    if '/' in course:
                        slash_found = True
                        course = course.replace('/', '')
                        # print(course)
                        course_fullcode.append(course)
                        description_index = 2
                        course = text[1].strip()

                        # print(course)

                        try:
                            if not course.split()[1][0].isnumeric():
                                description_index = 1
                                another_course = False
                        except IndexError:
                            return # if there is an error ignore the course                        
            

                    if not slash_found or (slash_found and another_course):
                        course_fullcode.append(course)
                    
                    description = '\n'.join(text[description_index:])
                    description.replace('"', '')

                    # print(course_fullcode)

                    for crs in course_fullcode:
                        subj, code, *_ = crs.split() # *_ is used to get rid of the title part if found in crs
                        courses[subj+code] = (subj, code, description)

                    # print(course_fullcode)
                    # print(description)

def process_pdf(file_name, type):
    # Open a PDF file
    print('reading from', file_name)


    if (type == FileType.ONLINE):
        url_name = file_name
        file_name = file_name.split('/')[-1]
        if not os.path.exists(file_name):
            try:
                wget.download(url_name)
                print()
            except urllib.error.HTTPError as err:
                print(err)
                return {} # return an empty dictionary


    # since we are using parallel programming two files might end up having the same name
    # therefore we change the files into some random name as they will be deleted anyways
    if FileType.ONLINE:
            temp_name = f'{str(random.randint(1,2000))}.pdf'
            os.rename(file_name, temp_name)
            file_name = temp_name

    fp = open(file_name, 'rb')
    # Create a PDF parser object associated with the file object.
    parser = PDFParser(fp)
    # Create a PDF document object that stores the document structure.
    # Supply the password for initialization.
    document = PDFDocument(parser)
    # Check if the document allows text extraction. If not, abort.
    if not document.is_extractable:
        raise PDFTextExtractionNotAllowed

    # Create a PDF resource manager object that stores shared resources.
    rsrcmgr = PDFResourceManager()
    # Set parameters for analysis.
    laparams = LAParams()
    # Create a PDF page aggregator object.
    device = PDFPageAggregator(rsrcmgr, laparams=laparams)
    interpreter = PDFPageInterpreter(rsrcmgr, device)
    # Store Information and Data
    courses = {} # store courses info in a dictionary
    # Process each page contained in the document.
    for page in PDFPage.create_pages(document):
        interpreter.process_page(page)
        # receive the LTPage object for the page.
        layout = device.get_result()

        elements = []

        for element in layout:
            elements.append(element)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            for element in elements:
                executor.submit(process_element,args=[element, courses])

    parser.close()
    fp.close()
    if type == FileType.ONLINE:
        os.remove(file_name) # remove file after processing  
    # print(len(courses),'courses has been extracted...\n')
    return courses

if __name__ == "__main__":
    start = time.perf_counter()
    process_pdf('https://www.aub.edu.lb/Registrar/Documents/catalogue/undergraduate19-20/ceae.pdf', FileType.ONLINE)
    end = time.perf_counter()
    print(f'PDF Extraction took {round((end - start), 2)} secs')