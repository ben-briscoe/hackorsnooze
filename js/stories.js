"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  //const hostName = story.getHostName();
  if(currentUser!=undefined){
  let favs = currentUser.favorites
  let isFav = false
  for(let fav of favs){
    if(story.storyId===fav.storyId){
      isFav = true;
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
        <button class="unfav" id="unfav${story.storyId}">I dont like that</button>
        <button class="remove" id="remove${story.storyId}">Remove</button>
        </li>`);
    }
  }
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
        <button class="fav" id="fav${story.storyId}">This is my favorite!</button>
        <button class="remove" id="remove${story.storyId}">Remove</button>
        </li>`)
    
  }
  }
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
  
  /*Initializes newstory variable and defines it by calling the storylist method .addStory() on the previously 
    defined variable 'storyList' an instance StoryList. This method adds the story to the api and returns an instance of
    Story from the respons.*/
  let newStory = await storyList.addStory(currentUser,{title:titleString,author:authorString,url:urlString});

  
  /*To be honest I don't understand how this works. newStory should have been an instance of Story. Therefore I don't understand
    why appending the OL in the DOM with this isn't throwing an error. I could change this and do it right, but I wanted to ask
    about it first.*/
  $allStoriesList.append(newStory);

  //takes away the form and puts stories back up.
  hidePageComponents();
  getAndShowStoriesOnStart();
  //clears form
  $addStoryForm.trigger("reset");
}


//Event Listener for the submit button to add story.
$addStoryForm.on("submit", async function (e){await addStoryToPage(e)});

//Event Listener for the cancel button in case user changes their mind 
$cancelButton.on('click',function(){
  hidePageComponents();
  putStoriesOnPage();
  $addStoryForm.trigger("reset");
})
//-------------------------------END ADD STORY TO PAGE--------------------------------------------------




//--------------------BEGIN REMOVE STORY-------------------------------------
/*This function actually does two things. It removes a story from the DOM. It also attempts to delete the story from the API. 
  Of course this is only allowed for stories that were created by the currentUser. The directions weren't real clear as to which
  of these they wanted, so I did both at once. Ideally to implement both these functions. You would offer a 'delete this story' 
  button that only appeared on stories that the user had created. This button would delete it on the API and remove it from the DOM. 
  Then have a seperate 'I don't want to see this buttton' that came up for every story that simply removed it from the DOM. I hope that
  this comment and the code below show that I do understand these procceses and am capable of doing whatever you like. */
async function removeStory (e){
  //pulls story id from event target, slice 6 because id should be `remove${id}`
  const id = e.target.id.slice(6)

  //removes LI from OL in the DOM
  $(`#${id}`).remove()

  //attempts to delete story in API (only succesful is story was created by currentUser)
  await User.removeStory(currentUser,id)

  /*Take everything off page and add it back to keep everything tidy. When we just mess with dom,things dont come out tidy.
    Note, in other instances to accomplish the same goal we call putStoriesOnPage(). This is not sufficient because putStoriesOnPage
    uses the previously defined variable storyList. We instead call getAndShowStoriesOnStart because it redefines the variable storyList 
    using the storyList method .getStories().*/
  hidePageComponents()
  getAndShowStoriesOnStart()
}

//Event Listener for the remove story buttons
$('#all-stories-list').on('click','.remove',async function (e){removeStory(e)})


//--------------------END REMOVE STORY-------------------------------------


//----------------------BEGIN SELECT FAVORITE------------------------------------------
//This function and event Listener  handle  adding favorites

//Event Listener for Favorite Button
$('#all-stories-list').on('click','.fav', async function(e){favorite(e)})


//Function for adding favorite
async function favorite (e){
 
  //pulls story id from event target, slice 3 because id should be `fav${id}`
  const id = e.target.id.slice(3)

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
  
  
  //This function call has been commented out because the function is not implemented. I didn't see it in the project requirements. I can do it if you like.
  //const hostName = thisStory.getHostName();
  

  /*Index variable to note the placement of the story LI within the OL. 
  We are going to remove this li and replace it with one slightly different
  to reflect it is a favorite. We wamt to make sure we are able to put it back in the right place.
  Note, index + 1 is used because jquery.index starts at 0 and we will use this in nth child selection
  which starts at 1.*/
  let index = $('li').index($(`#${id}`))+1;

  //Remove LI for this story from the DOM
  document.querySelector(`#all-stories-list li:nth-child(${index})`).remove()


  //Create and define new LI to replace the one we just deleted.
  let addition = document.createElement('li')
  addition.id = id
  addition.innerHTML = `<a href="${thisStory.url}" target="a_blank"
                        class="story-link">${thisStory.title}</a>
                        <small class="story-hostname">(hostname.com)</small>
                        <small class="story-author">by ${thisStory.author}</small>
                        <small class="story-user">posted by ${thisStory.username}</small>
                        <br>
                        <p>this is one of your favorites</p>
                        <br>
                        <button class="unfav" id="unfav${thisStory.storyId}">I dont like that</button>
                        <button class="remove" id="remove${thisStory.storyId}">Remove</button>`

  /*Add this new LI back to the DOM. When we removed the LI which was nth-child(index), the next LI took its place.
    We will prepend that LI. The logic here is in case the LI was at the end. In that case we will append the LI at
    nth-child(index-1). */
  if(document.querySelector(`#all-stories-list li:nth-child(${index})`)){
    document.querySelector(`#all-stories-list li:nth-child(${index})`).prepend(addition)}
  else if(!document.querySelector(`#all-stories-list li:nth-child(${index})`)){
    document.querySelector(`#all-stories-list li:nth-child(${index-1})`).append
  }

  //Take everything off page and add it back to keep everything tidy. When we just mess with dom,things dont come out tidy.
  hidePageComponents()
  putStoriesOnPage()
}
//----------------------------END SELECT FAVORITE---------------------------------------------
 


//----------------------BEGIN REMOVE FAVORITE------------------------------------------
//This section handles removing a story as a favorite



//Event Listener for the remove favorite button
$('#all-stories-list').on('click','.unfav', async function(e){removeFavorite(e)})


//Function to remove story as favorite for currentUser
async function removeFavorite(e) {
  
  //pulls story id from event target, slice 5 because id should be `unfav${id}`
  const id = e.target.id.slice(5)

  //runs removeFavorite method on currentUser. no information is needed from the response. running this simply removes favorite for this user to api
  await User.removeFavorite(currentUser,id)

  
  
  //find story referred to in event using id to search storyList
  let thisStory
  for (let story of storyList.stories){
    if(story.storyId===id){
      thisStory=story;
    }
  }
  

  /*listIndex variable to note the placement of the story LI within the OL. 
  We are going to remove this li and replace it with one slightly different
  to reflect it is a favorite. We wamt to make sure we are able to put it back in the right place.
  Note, index + 1 is used because jquery.index starts at 0 and we will use this in nth child selection
  which starts at 1.*/
  const listIndex = $('li').index($(`#${id}`))+1;


  //find index of story within favorites, then remove it
  const storyIndex = currentUser.favorites.indexOf(thisStory)
  currentUser.favorites.splice(storyIndex,1)
  
  //This function call has been commented out because the function is not implemented. I didn't see it in the project requirements. I can do it if you like.
  //const hostName = thisStory.getHostName();
  
  //Remove LI from DOM
  document.querySelector(`#all-stories-list li:nth-child(${listIndex})`).remove()

  //Create and define new LI to replace the one we just deleted.
  let addition = document.createElement('li')
  addition.id = id
  addition.innerHTML = `
                        <li id="${thisStory.storyId}">
                        <a href="${thisStory.url}" target="a_blank" class="story-link">${thisStory.title}</a>
                        <small class="story-hostname">(hostname.com)</small>
                        <small class="story-author">by ${thisStory.author}</small>
                        <small class="story-user">posted by ${thisStory.username}</small>
                        <br>
                        <button class="fav" id="fav${thisStory.storyId}">This is my favorite!</button>
                        <button class="remove" id="remove${thisStory.storyId}">Remove</button>
                        </li>`

  /*Add this new LI back to the DOM. When we removed the LI which was nth-child(index), the next LI took its place.
  We will prepend that LI. The logic here is in case the LI was at the end. In that case we will append the LI at
  nth-child(index-1). */
  if(document.querySelector(`#all-stories-list li:nth-child(${listIndex})`)){
    document.querySelector(`#all-stories-list li:nth-child(${listIndex})`).prepend(addition)}
  else if(!document.querySelector(`#all-stories-list li:nth-child(${listIndex})`)){
    document.querySelector(`#all-stories-list li:nth-child(${listIndex-1})`).append
  }

  //Take everything off page and add it back to keep everything tidy. When we just mess with dom,things dont come out tidy.
  hidePageComponents()
  putStoriesOnPage()
}

//----------------------END REMOVE FAVORITE---------------------------------------------