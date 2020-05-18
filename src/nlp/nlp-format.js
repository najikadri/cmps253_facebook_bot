// this module is responsible for convert the NLP object after getting a response into Action format
// this allows to process each intent and format it into the action format that is described
// in the NLP manager

module.exports = (nlp_object, successFunc) => {

    // console.log(nlp_object);

    var intent = nlp_object.intent;
    // format the NLP object based on intent
    switch(intent){
        //default case
        case 'None':
            process_None_Intent(nlp_object);
            break;
        case 'links.show':
            nlp_object.action = '#links.show';
            break;
        case 'courses':
            process_courses_Intent(nlp_object);
            break;
        case 'courses.title':
            process_title_Intent(nlp_object);
            break;
        case 'lectures':
            process_lectures_Intent(nlp_object);
            break;
        case 'lectures.whoteaches':
            process_whoTeaches_Intent(nlp_object);
            break;
        case 'issue':
            nlp_object.action = '#issues.prompt';
            break;
        case 'departments':
            nlp_object.action = '#departments.core';
            break;
        case 'buildings':
            nlp_object.action = '#buildings.core';
            break;
        case 'tuition':
            process_tuition_Intent(nlp_object);
            break;
        case 'studyplan':
            process_studyplan_Intent(nlp_object);
            break;
        case 'buildings.show':
            process_building_Intent(nlp_object);
            break;
        case 'catalogue':
            process_catalogue_Intent(nlp_object);
            break;
        case 'courses.info':
            process_coursesInfo_Intent(nlp_object);
            break;
        case 'instructors.info':
            process_instructorInfo_Intent(nlp_object);
            break;
        case 'info':
            process_info_Intent(nlp_object);
            break;
        case 'faqs':
            nlp_object.action = '#faqs.core';
            break;

    }

    successFunc(nlp_object);

}


function get_entity (name, nlp_object, option ){
    
    var entities = nlp_object.entities;

    for(var i = 0; i < entities.length; i++){

        if(!!option){
            if(entities[i].entity === name && entities[i].option === option){
                return entities[i];
            }
        }else{
            if(entities[i].entity === name){
                return entities[i];
            }
        }

    }
}

// convert abbreviations and shortcuts
function expand_shorcut (text){
    text = text.toLowerCase();

    if(text == 'undergrad'){
        text = 'undergraduate';
    }

    if(text === 'grad'){
        text = 'graduate';
    }

    if(text === 'dep'){
        text = 'department';
    }

    return text;
}

function get_entities (name, nlp_object){
    return nlp_object.entities.filter( (entity_obj) => entity_obj.entity === name);
}

function get_text (entity){
    return expand_shorcut(entity.utteranceText);
}

function format_day (datetime){
    var days_map = {
        'monday': 'm',
        'tuesday': 't',
        'wednesday': 'w',
        'thursday': 'r',
        'friday': 'f'
    }

    var res = '';

    // do iterations since we care about order
    var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    for(var i = 0; i < days.length; i++){
        for( var j = 0; j < datetime.length; j++){
            if (datetime[j].sourceText === days[i]){
                res += days_map[days[i]];
            }
        }
    }

    //add shorcuts too
    for(var i = 0; i < datetime.length; i++){
        if(datetime[i].option == 'day_shortcut'){
            res += datetime[i].sourceText;
        }
    }

    return res;
}

function get_info_tag (info, tag){

    for(var i = 0; i < info.length; i++){
        if (tag instanceof Array){
            for(var j = 0; j < tag.length; j++){
                if (info[i].sourceText === tag[j]){
                    return info[i];
                } 
            }
        }else{
            if (info[i].sourceText === tag){
                return info[i];
            }
        }
    }
}

//--------------------------------------------------------------------
// INTENT FORMAT AND PROCESS

// try to find out the meaning of the text if
// no intent has been identified
function process_None_Intent (nlp_object){

    var utternace = nlp_object.utterance;
    var text = utternace.toLowerCase(); // use if we care to see what the text contains

    if(text == 'okay' || text == 'ok' || text == 'alright' | text == 'aha' | text == 'yup' || text == 'yes'){
        nlp_object.answer = '👍';
    }

    if( text.includes('flapjack') ){
        nlp_object.answer = 'yes?';
    }

    if(
        text.includes('help') || text.includes('assistance') || text.includes('assist') || 
        text.includes('guidance')  || text.includes('guide')
    ){
        nlp_object.action = '#help.core';
        nlp_object.answer = undefined;
    }

    if(text === 'next' || text.includes('next query') || text.includes('next page') ){
        nlp_object.action = '#query.next';
        nlp_object.answer = undefined;
    }

}

function process_courses_Intent (nlp_object){

    var course_subject = get_entity('course', nlp_object);
    var course_attribute = get_entity('course_attribute', nlp_object);

    if(!!course_subject && !!course_attribute){
        nlp_object.answer = 'please either choose an attribute or a course subject';
    }else if (!!course_subject){
        var course = get_text(course_subject);
        nlp_object.action = `#courses.subject > subj:${course}`;
    }else if (!!course_attribute){
        var attribute = get_text(course_attribute);
        nlp_object.action = `#courses.attribute > attr:${attribute}`;
    }else{
        nlp_object.action = '#courses.core';
    }

}


function process_title_Intent (nlp_object){
    var course_subject = get_entity('course', nlp_object);
    var course_code = get_entity('course_code', nlp_object);

    if(!!course_subject && !!course_code){
        var subject = get_text(course_subject);
        var code = get_text(course_code);
        nlp_object.action = `#courses.title > subj:${subject} , code:${code}`;
    }else if(!!course_subject){
        nlp_object.answer = 'You need to specify both course subject and code';
    }else{
        nlp_object.answer = 'Please provide course subject and code to get its title';
    }
}

function process_lectures_Intent (nlp_object){

    var course_subject = get_entity('course', nlp_object);
    var course_code = get_entity('course_code', nlp_object);
    var building = get_entity('building', nlp_object);
    var datetime = get_entities('datetime', nlp_object);

    var subj = (!!course_subject ? get_text(course_subject) : undefined);
    var code = (!!course_code ? get_text(course_code) : undefined);

    subj = (!!subj ? `, subj:${subj}` : '');

    code = (!!subj && !!code ? `, code:${code}` : ''); // there must be a subject

    if (!!building && datetime.length > 0){
        var days = format_day(datetime);
        var bldgname = get_text(building);
        nlp_object.action = `#lectures.building_and_days > in:${bldgname} , on:${days} ${subj} ${code}`;
    }else if (!!building){
        var bldgname = get_text(building);
        nlp_object.action = `#lectures.building > in:${bldgname} ${subj} ${code}`;
    }else if (datetime.length > 0){
        var days = format_day(datetime);
        nlp_object.action = `#lectures.days > on:${days} ${subj} ${code}`;
    }else if(!!course_subject){
        nlp_object.action = `#lectures.course > subj:${get_text(course_subject)} ${code}`;
    }else{
        nlp_object.answer = 'please specify what lectures do you want';
    }
}


function process_tuition_Intent (nlp_object){
    var department = get_entity('degree', nlp_object, 'department');
    var degree_level = get_entity('degree', nlp_object, 'level');

    if(!!department && !!degree_level){
        var dep = get_text(department);
        var deglvl = get_text(degree_level);
        nlp_object.action = `#tuitions.core > dep:${dep} , deglvl:${deglvl}`;
    }else if (!!department){
        var dep = get_text(department);
        nlp_object.action = `#tuitions.core > dep:${dep}`;
    }else{
        nlp_object.answer = 'Please choose a department to view its tuition costs';
    }
}

function process_studyplan_Intent (nlp_object){
    var department = get_entity('degree', nlp_object, 'department');
    var degree_level = get_entity('degree', nlp_object, 'level');

    if(!!department && !!degree_level){
        var dep = get_text(department);
        var deglvl = get_text(degree_level);
        nlp_object.action = `#studyplan.core > major:${dep} , deglvl:${deglvl}`;
    }else if (!!department){
        nlp_object.answer = 'Please choose the degree level to provide a study plan';
    }else{
        nlp_object.answer = 'Please choose a department and degree level to view its study plan';
    }
}

function process_building_Intent (nlp_object){

    var building = get_entity('building', nlp_object);

    if(!!building){
        nlp_object.action = `#buildings.show > bldgname:${get_text(building)}`;
    }else{
        nlp_object.answer = 'Tell me the name of the building that you are looking for';
    }
}

function process_catalogue_Intent (nlp_object){
    var department = get_entity('degree', nlp_object, 'department');
    var degree_level = get_entity('degree', nlp_object, 'level');

    if(!!department && !!degree_level){
        var dep = get_text(department);
        var deglvl = get_text(degree_level);
        nlp_object.action = `#catalogue.core > dep:${dep} , deglvl:${deglvl}`;
    }else if (!!department){
        nlp_object.answer = 'Please choose the degree level to provide the catalogue';
    }else{
        nlp_object.answer = 'Please choose a department and degree level to view its catalogue';
    }
}

function  process_instructorInfo_Intent (nlp_object){

    var first_name = get_entity('instructor', nlp_object, 'first_name');
    var last_name = get_entity('instructor', nlp_object, 'last_name');

    first_name = (!!first_name ? get_text(first_name) : '');
    last_name = (!!last_name ? get_text(last_name) : '');

    if(first_name == last_name){
        var names = get_entities('instructor', nlp_object);

        if (names.length > 2){
            last_name = get_text(names[2]);
        }else{

            last_name = '';
        }
    }

    var name = String(first_name + ' ' + last_name).replace(/^\s+|\s+$/g, ''); // trim string

    nlp_object.action = `#instructors.info > name:${name}`;
}

function  process_coursesInfo_Intent (nlp_object){

    var course_subject = get_entity('course', nlp_object);
    var course_code = get_entity('course_code', nlp_object);
    var subject = get_text(course_subject);

    if(!!course_code){
        var code = get_text(course_code);
        nlp_object.action = `#courses.info > subj:${subject}  , code:${code}`;
    }else{
         nlp_object.answer = 'You need to type course subject and code to get info about it (e.g. info about cmps 200)';
    }
}


function process_info_Intent (nlp_object){

    var department = get_entity('degree', nlp_object, 'department');
    var info = get_entities('info', nlp_object);

    var president = get_info_tag(info, 'president');
    var chairperson = get_info_tag(info, ['chairman', 'chairperson', 'chairwoman','chair']);
    var contact = get_info_tag(info, 'contact');
    var department_keyword = get_info_tag(info, ['department', 'dep']);

    if(!!president){
        nlp_object.action = '#info.get > tag:president';
    }else if(!!chairperson){
        if(!!department){
            // for now we only have computer science department
            nlp_object.action = '#info.get > tag:cmps_chairperson';
        }else{
            nlp_object.answer = 'Specify the department so I can tell you its chairperson';
        }
    }else if(!!contact && !!department_keyword){
        if(!!department){
             // for now we only have computer science department
             nlp_object.action = '#info.get > tag:cmps_dep_contact_info';
        }else{
            nlp_object.answer = 'Specify the department so I can show you its contact info';
        }
    }else if (!!department_keyword){
        if(!!department){
            // for now we only have computer science department
            nlp_object.action = '#info.get > tag:cmps_dep';
       }else{
           nlp_object.answer = 'Specify the department so I can tell you more about it';
       }
    }
}

function  process_whoTeaches_Intent(nlp_object){

    var course_subject = get_entity('course', nlp_object);
    var course_code = get_entity('course_code', nlp_object);
    if(!!course_subject) {
        var subject = get_text(course_subject);
        var code = (!!course_code ? get_text(course_code) : undefined);
        code = (!!subject && !!code ? `, code:${code}` : '');

        nlp_object.action = `#lectures.whoteaches > subj:${subject} ${code}`;
    }else{
        nlp_object.answer = 'Please choose subject or subject and code (e.g. CMPS 253 instructors)';
    }
}



//--------------------------------------------------------------------

