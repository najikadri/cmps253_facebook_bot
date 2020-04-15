// This module (class) is responsible for the interaction between 
// facebook's API and the server/bot
// This will handle any request sent from/to facebook's graph api

const fetch = require('node-fetch');
const dbm = require('./database-manager').instance();



// Don't forget to add it to your `variables.env` file.
const { FACEBOOK_ACCESS_TOKEN } = process.env;

// naji kadri psid: 3219726614708296

class FB_API_Manager {

    constructor() {

        if(!!FB_API_Manager.instance){
            return FB_API_Manager.instance;
        }

        FB_API_Manager.instance = this;

        return this;
    }

}


// get users profile infromation from facebook like name, and profile pic

FB_API_Manager.prototype.getProfileInfo  = async (userId) => {
    // fetch(`https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic&access_token=${FACEBOOK_ACCESS_TOKEN}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         return data;
    //     }).catch( (err) => {
    //         console.log(err);
    //     })


    const response = await fetch(`https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic&access_token=${FACEBOOK_ACCESS_TOKEN}`);
    const json = await response.json();

    return json;
}


// send a regular text message to facebook users
FB_API_Manager.prototype.sendTextMessage = (userId, text) => {

    return fetch(
      `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          messaging_type: 'RESPONSE',
          recipient: {
            id: userId,
          },
          message: {
            text,
          },
        }),
      }
    );

};


// send a message with a next postback button to display next page of a a query message
FB_API_Manager.prototype.displayQueryMessage = (userId, msg) => {
  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          text: msg,
          quick_replies: [
            {
              content_type: "text",
              title: "👉 Next Page",
              payload: "NEXT_PAGE"
              // image_url :"http://example.com/img/green.png"   // use to add images to quick replies 
            }
          ]
        },
      }),
    }
  );
};

// send an image attachment
//note: it uses facebook api version 6.0 not 2.6
FB_API_Manager.prototype.sendImageMessage = (userId, image_url) => {

  return fetch(
    `https://graph.facebook.com/v6.0/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: image_url,
              is_reusable: true
            }
          }
        },
      }),
    }
  );

};

// send a message containing the link to a file
FB_API_Manager.prototype.sendFileMessage = (userId, file_url) => {

  return fetch(
    `https://graph.facebook.com/v6.0/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          attachment: {
            type: 'file',
            payload: {
              url: file_url,
              is_reusable: true
            }
          }
        },
      }),
    }
  );

};


// send a generic template

FB_API_Manager.prototype.sendGenericTemplate = (userId, msg_title, msg_subtitle, msg_image_url, msg_def_action_url) => {

  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: msg_title,
                  image_url: msg_image_url,
                  subtitle: msg_subtitle,

                  default_action: {
                    type: 'web_url',
                    url: msg_def_action_url,
                    webview_height_ratio: 'tall',
                  }
                }

              ]
            }
          }
        },
      }),
    }
  );

};

// send most important AUB links
FB_API_Manager.prototype.sendUniversityLinks = (userId) => {

  return fetch(
    `https://graph.facebook.com/v2.6/me/messages?access_token=${FACEBOOK_ACCESS_TOKEN}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          id: userId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: "General",
                  image_url: 'https://www.aub.edu.lb/HomeRotator/aub-homepage-MO1_9124.jpg',
                  subtitle: 'Important and useful links for everyone',

                  default_action: {
                    type: 'web_url',
                    url: 'https://www.aub.edu.lb/',
                    webview_height_ratio: 'tall',
                  },

                  buttons: [
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/academics/pages/majors_programs.aspx',
                      title: 'Majors and Programs'
                    },
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/admissions/Pages/default.aspx',
                      title: 'Admissions'
                    },
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/registrar/pages/default.aspx',
                      title: 'Registrar'
                    },
                  ]
                },

                {
                  title: "Students",
                  image_url: 'https://pbs.twimg.com/media/Cx9p7A6XcAEPmHM.jpg:large',
                  subtitle: 'Indispensable links for AUB Students',

                  default_action: {
                    type: 'web_url',
                    url: 'https://www.aub.edu.lb/president/titleix/Pages/default.aspx',
                    webview_height_ratio: 'tall',
                  },

                  buttons: [
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/Pages/Webmail.aspx',
                      title: 'Webmail'
                    },
                    {
                      type: 'web_url',
                      url: 'https://www-banner.aub.edu.lb/pls/weba/twbkwbis.P_WWWLogin',
                      title: 'AUBsis'
                    },
                    {
                      type: 'web_url',
                      url: 'https://lms.aub.edu.lb/',
                      title: 'AUB Moodle'
                    },
                    // {
                    //   type: 'web_url',
                    //   url: 'https://www.aub.edu.lb/admissions/Pages/TC/index.html',
                    //   title: 'Tuition Calculator'
                    // }
                  ]
                },



                {
                  title: "Academics",
                  image_url: 'https://greenarea.me/wp-content/uploads/2016/01/AUB-Logo-833x833.jpg',
                  subtitle: 'Academics related links',

                  default_action: {
                    type: 'web_url',
                    url: 'https://www.aub.edu.lb/Pages/AUBSIS.aspx',
                    webview_height_ratio: 'tall',
                  },

                  buttons: [
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/libraries/Pages/default.aspx',
                      title: 'Libraries'
                    },
                    {
                      type: 'web_url',
                      url: 'https://epetitions.aub.edu.lb/ords/f?p=101:101',
                      title: 'Petition'
                    },
                    {
                      type: 'web_url',
                      url: 'https://www.aub.edu.lb/admissions/Pages/TC/index.html',
                      title: 'Tuition Calculator'
                    },
                    
                  ]
                }


              ]
            }
          }
        },
      }),
    }
  );

};



// send a common message to all users in the database
FB_API_Manager.prototype.broadcastMessage = function(text) {

    dbm.table.users.forEach(client => {
        this.sendTextMessage(client.fid, text);
    });
}





module.exports = { instance : function() { return new FB_API_Manager() } };