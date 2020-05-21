$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $loggedInNavs=$("#logged-in-navs");


  const $userProfile=$("#user-profile");
  const $profileName =$("#profile-name");
  const $profileUsername =$("#profile-username");
  const $profileAccountDate = $("#profile-account-date");
  const $favoritedArticles = $("#favorited-articles")

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function() {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      fillUserInfo();
      $userProfile.show();
    }
    else{
    $userProfile.hide();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
    fillUserInfo();
    $userProfile.show();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story,userStory) {
    let hostName = getHostName(story.url);
    let star;
    checkIfFavorite(story)?star="fas":star="far"


    let removeIcon;
    if(userStory)
    {
      removeIcon=`<span class="trashcan"> '<i class="fas fa-trash-alt"></i>'</span>`
    }
    else{
      removeIcon="";
    }

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <span class="favoriteIcon"><i class="${star} fa-star"></i></span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small> ${removeIcon}
        <small class="article-username">posted by ${story.username}</small>
      </li>
     
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $loggedInNavs.show();
  
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

  /**Adds current user info to the dom */
  function fillUserInfo(){
    $profileName.text(`Name: ${currentUser.name}`)
    $profileUsername.text(`Username: ${currentUser.username}`)
    $profileAccountDate.text(`Account Created: ${currentUser.createdAt.slice(0,10)}`)
  }


  /**click handlers for submitting a new story  */
$("#submit-story").on("click",()=>{
  $submitForm.toggle();
})
$("#submit-form").on("submit",async (evt)=>{
  evt.preventDefault();
  hideElements();
  const newStory={
    author:$("#author").val(),
    title: $("#title").val(),
    url:$("#url").val()
  }
  await storyList.addStory(currentUser,newStory);
  $allStoriesList.show();
  generateStories();
})



/**handle click on favorite star */
$(".articles-container").on("click",".fa-star",async (evt)=>{
  
  if(currentUser)
  {
  let storyId=$(evt.target).closest("li").attr("id")
  $(evt.target).toggleClass("far fas")
  if($(evt.target).hasClass("fas"))
  {
    
    await currentUser.addFavoriteStory(currentUser, storyId)
  }
  else
  {
    await currentUser.removeFavoriteStory(currentUser, storyId)
  }
  }
  
})

/**handle click on favorites tab */
$("#favorites").on("click",()=>{
  $allStoriesList.hide();
  $ownStories.hide();
  $favoritedArticles.show();
  generateFavoriteStories();
})

/**generate html and append to dom for each favorited story*/
async function generateFavoriteStories(){
  console.log("my favorites")
  let favStories=currentUser.favorites;
  $favoritedArticles.empty();
  
  for (let story of favStories) {
    const result = generateStoryHTML(story,true);
    $favoritedArticles.append(result);
    $favoritedArticles.show();
  }
  }

  /** remove click handler on favorites tab*/
$("#favorited-articles").on("click",".fa-trash-alt",async (evt)=>{
  
  const id=$(evt.target.parentNode.parentNode).attr("id")
  await currentUser.removeFavoriteStory(currentUser,id)
  generateFavoriteStories();
})


/**check if story if story is one of the users favorite and retun boolean */
function checkIfFavorite(story)
{
  if(currentUser){
  console.log(currentUser.favorites.length)
  if(currentUser.favorites.length !==0)
  {
    let faves=new Set(currentUser.favorites.map(s=>s.storyId))
    return(faves.has(story.storyId))
  }
}
return
}


/**handle click on My Stories tab */
$("#my-stories").on("click",()=>{
  $allStoriesList.hide();
  $favoritedArticles.hide();
  $ownStories.show();
  generateMyStories();
})


async function generateMyStories(){
console.log("my stories")
const userStories=currentUser.ownStories;
$ownStories.empty();

for (let story of userStories) {
  const result = generateStoryHTML(story,true);
  $ownStories.append(result);
  $ownStories.show();
}
}

/** remove click handler on my stories*/
$("#my-articles").on("click",".fa-trash-alt",async (evt)=>{
  
  const id=$(evt.target.parentNode.parentNode).attr("id")
  await storyList.removeStory(currentUser,id)
  generateMyStories()
})

});


