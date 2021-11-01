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

async function addStoryToPage(e) {

  e.preventDefault();

  const titleString = $("#title").val();
  const authorString = $("#author").val();
  const urlString = $("#url").val();
  
  let newStory = await storyList.addStory(currentUser,{title:titleString,author:authorString,url:urlString});
  console.log(newStory)

  $allStoriesList.append(newStory);
  hidePageComponents();
  getAndShowStoriesOnStart();

  $addStoryForm.trigger("reset");
}

$addStoryForm.on("submit", async function (e){await addStoryToPage(e)});
$cancelButton.on('click',function(){
  hidePageComponents();
  putStoriesOnPage();
  $addStoryForm.trigger("reset");
})


//handles removing
$('#all-stories-list').on('click','.remove',async function (e){
  const id = e.target.id.slice(6)
  $(`#${id}`).remove()
  await User.removeStory(currentUser,id)
  hidePageComponents()
  getAndShowStoriesOnStart()
})


//Handles Favoriting
$('#all-stories-list').on('click','.fav', async function(e){
  //pulls story id from event target
  const id = e.target.id.slice(3)


  await User.addFavorite(currentUser,id)

  let index = $('li').index($(`#${id}`))+1;
  
  let thisStory
  for (let story of storyList.stories){
    if(story.storyId===id){
      thisStory=story;
    }
  }
  currentUser.favorites.push(thisStory)
  //const hostName = thisStory.getHostName();
  
  document.querySelector(`#all-stories-list li:nth-child(${index})`).remove()
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

  if(document.querySelector(`#all-stories-list li:nth-child(${index})`)){
    document.querySelector(`#all-stories-list li:nth-child(${index})`).prepend(addition)}
  else if(!document.querySelector(`#all-stories-list li:nth-child(${index})`)){
    document.querySelector(`#all-stories-list li:nth-child(${index-1})`).append
  }

  hidePageComponents()
  putStoriesOnPage()
})


//Handles removing favorite
$('#all-stories-list').on('click','.unfav', async function(e){
  
  //pull id from click event
  const id = e.target.id.slice(5)
  //ping api to remove as favorite
  await User.removeFavorite(currentUser,id)

  //Find index of li within ol
  const listIndex = $('li').index($(`#${id}`))+1;
  
  //find story using id to search storyList
  let thisStory
  for (let story of storyList.stories){
    if(story.storyId===id){
      thisStory=story;
    }
  }
  
  //find index of story within favorites, then remove it
  const storyIndex = currentUser.favorites.indexOf(thisStory)
  currentUser.favorites.splice(storyIndex,1)
  
  //const hostName = thisStory.getHostName();
  
  //Remove LI from DOM
  document.querySelector(`#all-stories-list li:nth-child(${listIndex})`).remove()

  //Create LI to add to DOM
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

  if(document.querySelector(`#all-stories-list li:nth-child(${listIndex})`)){
    document.querySelector(`#all-stories-list li:nth-child(${listIndex})`).prepend(addition)}
  else if(!document.querySelector(`#all-stories-list li:nth-child(${listIndex})`)){
    document.querySelector(`#all-stories-list li:nth-child(${listIndex-1})`).append
  }

  hidePageComponents()
  putStoriesOnPage()
})