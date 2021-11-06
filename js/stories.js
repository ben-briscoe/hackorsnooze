"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

//----------------BEGIN GENERATE MARKUP---------------------------
//This function generates html to add to the DOM for the stories list. I have ammended the code given to us in order to incorporate the buttons needed to 'favorite' 'unfavorite' and 'remove' stories.
function generateStoryMarkup(story) {


  //This conditional checks to see if there is a user logged in. If not, standard markup is generated.
  if(currentUser!=undefined){
    //Initialize variables
    let favs = currentUser.favorites //Pulls list of users favorite stories, we will iterate through this.
    let isFav = false //Setting this to false initially. If we iterate through favs without deciding the story is a favorite, then we generate markup for not a favorite.

    //This for loop will cycle through the favorites, seeing if any of their id's match the story that has been passed to this function. If they do, then we generate the necessary markup. we also redefine isFav to true so that the 'not favorite' markup is not generated.
    for(let fav of favs){
      if(story.storyId===fav.storyId){
        
        isFav = true;
        
        //Markup to return
        return $(`
          <li id="${story.storyId}">
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(hostname.com)</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
          <br>
          <p>this is one of your favorites</p>
          <br>
          <button class="unfav" data-storyID="${story.storyId}">I dont like that</button>
          <button class="remove" data-storyID="${story.storyId}">Remove</button>
          </li>`);
      }
    }

    //If the above loop found a favorite, this won't run. If it didnt, this generates markup for a 'not favorite' story.
    if(isFav===false){
      return $(`
        <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(hostname.com)</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <br>
        <button class="fav" data-storyID="${story.storyId}">This is my favorite!</button>
        <button class="remove" data-storyID="${story.storyId}">Remove</button>
        </li>`)
    
  }
  }
  //Generates standard markup if user is not logged in
  else {
    return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(hostname.com)</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
    </li>
  `);
  }

}
/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    let $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
  
}


//-------------------------------BEGIN ADD STORY TO PAGE--------------------------------------------------

//This function manages the form for a user to submit a new story to the API.
async function addStoryToPage(e) {

  //Keeps form submission from refreshing page.
  e.preventDefault();

  //pulls form data.
  const titleString = $("#title").val();
  const authorString = $("#author").val();
  const urlString = $("#url").val();
  
  /*calls the storylist method .addStory() on the previously defined variable 'storyList', an instance of StoryList. This method adds the story to the api. and also gives a response containing information needed to generate our own instance of that story.*/
  const apiStory = await storyList.addStory(currentUser,{title:titleString,author:authorString,url:urlString});
  
  //If the request is succesful, generate story instance to add to our instance of storyList.
  const newStory = new Story(apiStory);

  
  storyList.stories.unshift(newStory)

    /*refresh DOM*/
  hidePageComponents();
  putStoriesOnPage();

  /*--------------------------CHANGE THIS, DONT CALL getAndShowStoriesOnStart()!!!!!, use storyList.append*/

  //clears form
  $addStoryForm.trigger("reset");
}

//Event Listener for the submit button to add story.
$addStoryForm.on("submit", async function (e){await addStoryToPage(e)});

//Event Listener for the cancel button in case user changes their mind, just left function in here because its simple
$cancelButton.on('click',function(){
  //rehide add story form and put stories back on page. also empty form in case they left som garbage in it.
  hidePageComponents();
  putStoriesOnPage();
  $addStoryForm.trigger("reset");
})
//-------------------------------END ADD STORY TO PAGE--------------------------------------------------




//--------------------------------BEGIN REMOVE STORY------------------------------------------------------------
/*This function actually does two things. It removes a story from the DOM. It also attempts to delete the story from the API. 
  Of course this is only allowed for stories that were created by the currentUser. The directions weren't real clear as to which
  of these they wanted, so I did both at once. Ideally to implement both these functions. You would offer a 'delete this story' 
  button that only appeared on stories that the user had created. This button would delete it on the API and remove it from the DOM. 
  Then have a seperate 'I don't want to see this buttton' that came up for every story that simply removed it from the DOM. I hope that
  this comment and the code below show that I do understand these procceses and am capable of doing whatever you like. */
async function removeStory (e){
  //pulls story id from event target dataset
  const id = e.target.dataset.storyid

  //Instead of adding storyId through id attribute on the html button, use jquery method .data (look up html data attribute)

  //removes LI from OL in the DOM
  $(`#${id}`).remove()

  //attempts to delete story in API (only succesful is story was created by currentUser)
  await User.removeStory(currentUser,id)

  

  //This finds the index of this specific story within the storyList.stories array. We will use this to splice it out of there.

  let spliceIndex

  for (let i=0;i<storyList.stories.length;i++){
    if(storyList.stories[i].storyId===id){
      spliceIndex = i;
    }
  }

  storyList.stories.splice(spliceIndex,1)

 /*refresh DOM*/
  hidePageComponents()
  putStoriesOnPage()
}

//Event Listener for the remove story buttons
$('#all-stories-list').on('click','.remove',async function (e){removeStory(e)})


//--------------------END REMOVE STORY-------------------------------------


//----------------------BEGIN SELECT FAVORITE------------------------------------------
//This function and event Listener  handle  adding favorites




//Function for adding favorite
async function favorite (e){
 
  //pulls story id from event target dataset
  const id = e.target.dataset.storyid

  //runs add favorite method on currentUser. no information is needed from the response. running this simply adds favorite for this user to api
  await User.addFavorite(currentUser,id)


  //find story referred to in event using id to search storyList
  let thisStory
  for (let story of storyList.stories){
    if(story.storyId===id){
      thisStory=story;
    }
  }

  //Adds story referred to in event to the currentUser favorites list
  currentUser.favorites.push(thisStory)
  

  //Take everything off page and add it back to keep everything tidy. When we just mess with dom,things dont come out tidy.
  hidePageComponents()
  putStoriesOnPage()
}

//Event Listener for Favorite Button
$('#all-stories-list').on('click','.fav', async function(e){favorite(e)})
//----------------------------END SELECT FAVORITE---------------------------------------------
 


//----------------------BEGIN REMOVE FAVORITE------------------------------------------
//This section handles removing a story as a favorite


//Function to remove story as favorite for currentUser
async function removeFavorite(e) {
  
  //pulls story id from event target dataset
  const id = e.target.dataset.storyid

  //runs removeFavorite method on currentUser. no information is needed from the response. running this simply removes favorite for this user to api
  await User.removeFavorite(currentUser,id)

  
  
  //find story referred to in event using id to search storyList
  let thisStory
  for (let story of storyList.stories){
    if(story.storyId===id){
      thisStory=story;
    }
  }


  //find index of story within favorites, then remove it
  const storyIndex = currentUser.favorites.indexOf(thisStory)
  currentUser.favorites.splice(storyIndex,1)
  


 /*refresh DOM*/
  hidePageComponents()
  putStoriesOnPage()
}


//Event Listener for the remove favorite button
$('#all-stories-list').on('click','.unfav', async function(e){removeFavorite(e)})
//----------------------END REMOVE FAVORITE---------------------------------------------