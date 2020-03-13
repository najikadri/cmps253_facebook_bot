// this module is used to iterate over queries and do result partitioning
// this is extremely helpful as users might want to view queries that are 
// too big to be viewed in a one message and therefore the iterator 
// divides the array/object into small chunks that would be sent one by one


// this function is used to create an iterator
// the iterator partition the query into several pages with 
// k size of query elements and return them one by one

const createQueryIterator = function(query, parition_size){

    // this is used to make sure that the program don't go into an infinite loop
    if(parition_size == 0){
        throw 'query iterator must have a partition size greater than zero!';
    }

    const iterable = {
        [Symbol.iterator](){

            let arr = query;
            let pages = Math.ceil(arr.length / parition_size);
            let max_size = arr.length;
            let current_page = 0;

            return {

                next() {

                    if(current_page >= pages){
                        return { value: undefined, done: true};
                    }else{
                        let prev_page = current_page;
                        current_page++;
                        return { value: arr.slice(prev_page * parition_size, prev_page * parition_size + parition_size), done: false};
                    }
                },

                getPagesNum () { return pages;},

                getCurrentPage () { return current_page; }

            }
        }
    };

    //note [Symbol.iterator]() from iterable to have an iterable object instead of an iterator
    return iterable[Symbol.iterator](); 
}

module.exports = { createQueryIterator };