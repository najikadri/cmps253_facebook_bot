import csv
# A funtion which will read from a text file and return a list of every line
def text_file_formulate(filename_):

    file = open("{}.txt".format(filename_), 'r')

    lst = list(map(str.strip ,file.readlines())) # list of every line found in the text file stripped from \n

    return lst


# function in which it will formulate a string of parameters and values for example(Semester:Fall) and returns a tuple
# This tuple contains only values and it will be used for the excel file

def make_tuple(string_):
    lst = [] # We will split the string on ", " and store it in lst
    lst = string_.split(", ")
    new_lst = [] # This list will store the values
    for each in lst:
        new_lst.append(each.split(":")[1])
    
    return tuple(new_lst) # returning a tuple will make it easier to format in csv file

lst_all_lines = text_file_formulate("tuition_fees")


def make_csv(csv_filename):
    with open('{}.csv'.format(csv_filename), mode='w', newline = '') as f:
        f = csv.writer(f)
        f.writerow(('Semester', "Year", "Faculty", "Degree Level", "Cost per Credit($)"))
        for each in lst_all_lines:
            f.writerow(make_tuple(each))
make_csv("tuition_fees")