const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
const NUMBER_OF_CATEGORIES = 6; // The number of categories you will be fetching.
const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category.

let categories = []; // The categories with clues fetched from the API.
let activeClue = null; // Currently selected clue data.
let activeClueMode = 0; // Controls the flow of #active-clue element while selecting a clue, displaying the question of selected clue, and displaying the answer to the question.
let isPlayButtonClickable = true; // Only clickable when the game haven't started yet or ended. Prevents the button to be clicked during the game.

$("#play").on("click", handleClickOfPlay);

function handleClickOfPlay() {
  if (isPlayButtonClickable) {
      isPlayButtonClickable = true;
      setupTheGame(); // Start a new game
    }
  }

/**
 * Sets up the game.
 */
async function setupTheGame() {
  $("#spinner").show(); // Show the spinner while loading the game data

  // Reset the DOM (clear previous game data)
  $("#categories").empty();
  $("#clues").empty();
  $("#active-clue").html(null);
  $("#play").text("Restart the Game!"); // Change button text

  // Fetch the game data
  categories = [];
  const categoryIds = await getCategoryIds();
  for (let id of categoryIds) {
    const category = await getCategoryData(id);
    categories.push(category);
  }

  // Fill the table with fetched categories and clues
  fillTable(categories);

  $("#spinner").hide(); // Hide the spinner when the game data is ready
}

/**
 * Gets as many category IDs as in the `NUMBER_OF_CATEGORIES` constant.
 */
async function getCategoryIds() {
  const response = await fetch(`${API_URL}categories?count=100`);
  const data = await response.json();
  const validCategories = data.filter(
    (cat) => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY
  );

  const selectedCategories = [];
  while (
    selectedCategories.length <NUMBER_OF_CATEGORIES &&
    validCategories.length > 0
  ) {
    const index = Math.floor(Math.random() * validCategories.length);
    selectedCategories.push(validCategories[index].id);
    validCategories.splice(index, 1);
  }

  return selectedCategories;
}

/**
 * Gets category with as many clues as given in the `NUMBER_OF_CLUES` constant.
 */
async function getCategoryData(categoryId) {
  const response = await fetch(`${API_URL}category?id=${categoryId}`);
  const data = await response.json();

  const categoryWithClues = {
    id: data.id,
    title: data.title,
    clues: data.clues
      .slice(0, NUMBER_OF_CLUES_PER_CATEGORY)
      .map((clue, index) => ({
        id: clue.id,
        value: clue.value || (index + 1) * 100,
        question: clue.question,
        answer: clue.answer,
      })),
  };

  return categoryWithClues;
}

/**
 * Fills the HTML table using category data.
 */
function fillTable(categories) {
  // Fill the header row with categories
  for (let category of categories) {
    $("#categories").append(`<>${category.title}/>`);
  }

  // Add rows for clues
  for (let i = 0; i <NUMBER_OF_CLUES_PER_CATEGORY; i++) {
    const row = $("<tr>"); // Create a new row for each clue level
    for (let category of categories) {
      const clue = category.clues[i];
      const cell = $(`< class="clue" id="${category.id}-${clue.id}">$${clue.value}/>`);
      cell.on("click", handleClickOfClue); // Attach click event to each clue
      row.append(cell); // Add cell to the row
    }
    $("#clues").append(row); // Append the row to the table body
  }
}

/**
 * Manages the behavior when a clue is clicked.
 */
function handleClickOfClue(event) {
  const [categoryId, clueId] = event.target.id.split("-").map(Number); // Get category and clue IDs

  // Find the clue in the categories array
  for (let category of categories) {
    if (category.id === categoryId) {
      const clueIndex = category.clues.findIndex(clue => clue.id === clueId);
      if (clueIndex !== -1) {
        activeClue = category.clues.splice(clueIndex, 1)[0]; // Get and remove the clue
        if (category.clues.length === 0) {
          categories = categories.filter(cat => cat.id !== categoryId); // Remove category if no clues left
        }
        break;
      }
    }
  }

  // Mark clue as viewed and show the question
  $(event.target).addClass("viewed"); // Optional: mark the clue as 'viewed'
  $(event.target).css("background-color", "#bbb"); // Change background color to indicate it's been used
  $(event.target).off("click"); // Remove the click event to prevent further interaction

  activeClueMode = 1; // Set active clue mode to question
  $("#active-clue").html(activeClue.question); // Show the question in #active-clue section
}

$(document).ready(function () {
  $("#active-clue").on("click", handleClickOfActiveClue);
});

/**
 * Handles clicks on the active clue to toggle between the question and the answer.
 */
function handleClickOfActiveClue() {
  if (activeClueMode === 1) {
    activeClueMode = 2; // Show the answer
    $("#active-clue").html(activeClue.answer); // Display the answer

    // Mark the clue as completed by shading it
    $("#" + activeClue.categoryId + "-" + activeClue.id).css({
      "text-decoration": "line-through",
      "background-color": "#ccc", // Gray out the background color
      "color": "#999", // Lighten the text to indicate it's not active
      "cursor": "not-allowed" // Disable further clicks
    });
  } else if (activeClueMode === 2) {
    activeClueMode = 0; // Clear the active clue section
    $("#active-clue").html(null); // Hide the question/answer
  }
}

/**
 * Resets the game to its initial state.
 */
function resetGame() {
  // Reset the game state variables
  categories = [];
  activeClue = null;
  activeClueMode = 0;

  // Reset the table UI
  $("#categories").empty();
  $("#clues").empty();
  $("#active-clue").html(null);
  $("#play").text("Start the Game!"); // Reset the button text

  // Reset the play button clickability
  isPlayButtonClickable = true;

  // Show the spinner during game setup
  $("#spinner").show();

  // Setup a fresh game
  setupTheGame();

  // Hide the spinner once the game setup is complete
  $("#spinner").hide();
}

