const API_KEY = "<%= API_KEY %>";
const ASSISTANT_ID = "<%= ASSISTANT_ID %>";
let sessionId;
let totalWaterUsageMin = 0;
let totalWaterUsageMax = 0;
let googleSearchUsage = 0;

const boldWords = [
    "environmental", "energy", "water", "resources", "sustainable", "sustainability", "climate", "planet", "nature"
];

async function initializeChat() {
    try {
        const response = await axios.post('/api/chat/session');
        sessionId = response.data.session_id;
        console.log("Chat session initialized:", sessionId);
    } catch (error) {
        console.error("Error initializing chat session:", error);
        const errorMessage = document.createElement("div");
        errorMessage.textContent = "Error initializing chat session. Please try refreshing the page.";
        errorMessage.style.color = "red";
        document.getElementById("chatMessages").appendChild(errorMessage);
    }
}

async function sendMessage(message) {
    try {
        const response = await axios.post('/api/message', {
            message: message
        });

        console.log("Bot response:", response.data);

        const botReply = response.data.botReply || "No response from chatbot.";
        const tokensUsed = response.data.tokensUsed || 0;
        console.log("Tokens used:", tokensUsed);

        return { botReply, tokensUsed };
    } catch (error) {
        console.error("Error sending message:", error);
        return { botReply: "Sorry, the developer of this site is a student and they've hit their monthly OpenAI API usage budget ... so try again next month (or just reach out to me at anaya.maheshwari@gmail.com and I'll fix it! Thank you for your patience!)", tokensUsed: 0 };
    }
}

function updateWaterWall(tokensUsed) {
    console.log('updateWaterWall called with tokensUsed:', tokensUsed);

    // AI water usage calculations
    const minWaterPerToken = 0.35;
    const maxWaterPerToken = 0.89;
    const waterUsageMin = tokensUsed * minWaterPerToken;
    const waterUsageMax = tokensUsed * maxWaterPerToken;
    totalWaterUsageMin += waterUsageMin;
    totalWaterUsageMax += waterUsageMax;

    const averageWaterUsage = (totalWaterUsageMin + totalWaterUsageMax) / 2;
    const averageBottles = (averageWaterUsage / 500).toFixed(2);

    // Update AI water usage display
    const waterUsageText = document.getElementById("waterUsageText");
    waterUsageText.innerHTML = `Water usage in this session:<br>${totalWaterUsageMin.toFixed(2)}-${totalWaterUsageMax.toFixed(2)} ml`;

    const waterUsageBottles = document.getElementById("waterUsageBottles");
    waterUsageBottles.innerHTML = `Average of ${averageBottles} water bottles (500ml each)`;

    // Update Google search equivalent water usage
    googleSearchUsage += 1; // Add 1 mL per query
    const googleUsageText = document.getElementById("googleUsageText");
    if (googleUsageText) {
        googleUsageText.innerHTML = `Google Search equivalent usage:<br>${googleSearchUsage} ml`;
    }

    // Update visual elements (bottles)
    const waterWall = document.getElementById("waterWall");

    // Clear only bottle-related content, retain `googleUsageText` and links
    const bottleImages = waterWall.querySelectorAll('.bottle-image');
    bottleImages.forEach((image) => image.remove());

    const fullBottlesAverage = Math.floor(averageWaterUsage / 500);
    const partialBottlePercentage = (averageWaterUsage % 500) / 500 * 100;

    for (let i = 0; i < fullBottlesAverage; i++) {
        addWaterImage(100);
    }

    if (partialBottlePercentage > 0) {
        addWaterImage(partialBottlePercentage);
    }

    // Ensure links are present
    if (!document.querySelector('.fixed-links')) {
        const linksContainer = document.createElement('div');
        linksContainer.classList.add('fixed-links');

        const aboutLink = document.createElement('a');
        aboutLink.href = "#";
        aboutLink.id = "aboutLink";
        aboutLink.classList.add('popup-link');
        aboutLink.textContent = "About";
        linksContainer.appendChild(aboutLink);

        const usageStatementsLink = document.createElement('a');
        usageStatementsLink.href = "#";
        usageStatementsLink.id = "usageStatementsLink";
        usageStatementsLink.classList.add('popup-link');
        usageStatementsLink.textContent = "Usage Statements";
        linksContainer.appendChild(usageStatementsLink);

        waterWall.appendChild(linksContainer);

        document.getElementById('aboutLink').addEventListener('click', function () {
            document.getElementById('aboutPopup').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
        });

        document.getElementById('usageStatementsLink').addEventListener('click', function () {
            document.getElementById('usageStatementsPopup').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
        });
    }
}

function addWaterImage(percentage) {
    console.log('addWaterImage called with percentage:', percentage);
    const waterWall = document.getElementById("waterWall");
    if (!waterWall) {
        console.error('Element with id "waterWall" not found.');
        return;
    }

    const waterImageContainer = document.createElement('div');
    waterImageContainer.style.width = '60px';
    waterImageContainer.style.height = '120px';
    waterImageContainer.style.position = 'relative';
    waterImageContainer.style.overflow = 'hidden';
    waterImageContainer.style.margin = '5px';
    waterImageContainer.classList.add('bottle-image');

    const waterImage = document.createElement('img');
    const imageUrl = 'https://cdn.glitch.global/ce1b315c-fc4f-47ac-a928-221bfab9854e/bottle?v=1735753658353';
    waterImage.src = imageUrl;
    waterImage.alt = 'Water Image';
    waterImage.style.width = '60px';
    waterImage.style.height = '120px';
    waterImage.style.position = 'absolute';
    waterImage.style.bottom = '0';
    waterImage.style.clipPath = `inset(${100 - percentage}% 0 0 0)`;

    waterImage.onload = function () {
        console.log('Image loaded successfully:', imageUrl);
        waterImageContainer.appendChild(waterImage);
        waterWall.appendChild(waterImageContainer);
    };

    waterImage.onerror = function () {
        console.error('Error loading image:', imageUrl);
    };
}

const chatMessagesDiv = document.getElementById("chatMessages");

function saveChatToLocalStorage() {
  const allMessages = [];
  document.querySelectorAll('.chatBubble').forEach(el => {
    // Check if the message is one of the intro messages and skip it
    if (!introMessages.includes(el.innerHTML)) {
      allMessages.push({
        sender: el.classList.contains('user') ? 'user' : 'bot',
        text: el.innerHTML
      });
    }
  });
  localStorage.setItem("chatHistory", JSON.stringify(allMessages));
}


function loadChatFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  saved.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.classList.add('chatBubble', msg.sender);
    bubble.innerHTML = msg.text;
    chatMessagesDiv.appendChild(bubble);
  });
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

document.getElementById("resetBtn").addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  chatMessagesDiv.innerHTML = "";
  displayIntroMessages(false);
});


const queryForm = document.getElementById("queryForm");
const queryInput = document.getElementById("query");
const loadingIndicator = document.getElementById("loadingIndicator");

const introMessages = [
    "Welcome to Thirsty Robot, the eco-conscious, text-based AI assistant! 💧 Processing AI queries consumes energy and water – to save resources, I use as few words as possible.",
    "With each interaction, I’ll calculate and visually track your approximate water usage throughout this session on the left of the screen. For simple questions, consider if AI is the best way to find your answer. 🌎",
    "So, how can I quench your thirst for knowledge today?"
];

function displayIntroMessages(save = true) {
  introMessages.forEach((message, index) => {
    setTimeout(() => {
      const botBubble = document.createElement('div');
      botBubble.classList.add('chatBubble', 'bot');
      botBubble.innerText = message;
      chatMessagesDiv.appendChild(botBubble);
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
      if (save) saveChatToLocalStorage();
    }, index * 2000);
  });
}


loadChatFromLocalStorage(); 


function boldenText(text) {
    boldWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, (match) => `<strong>${match}</strong>`);
    });
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return text;
}

async function handleQuerySubmit(event) {
    event.preventDefault();
    const query = queryInput.value.trim();
    if (!query) return;

    const userBubble = document.createElement('div');
    userBubble.classList.add('chatBubble', 'user');
    userBubble.textContent = query;
    chatMessagesDiv.appendChild(userBubble);

    queryInput.value = '';
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    loadingIndicator.style.display = 'flex';

    const { botReply, tokensUsed } = await sendMessage(query);

    loadingIndicator.style.display = 'none';

    const botBubble = document.createElement('div');
    botBubble.classList.add('chatBubble', 'bot');

    const formattedResponse = boldenText(botReply);

    botBubble.innerHTML = formattedResponse;

    chatMessagesDiv.appendChild(botBubble);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;

    updateWaterWall(tokensUsed);
  saveChatToLocalStorage(); 
}

displayIntroMessages();

queryForm.addEventListener("submit", handleQuerySubmit);

initializeChat();

loadingIndicator.style.display = 'none';

queryInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleQuerySubmit(event);
    }
});

document.getElementById('aboutLink').addEventListener('click', function() {
    document.getElementById('aboutPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
});

document.getElementById('usageStatementsLink').addEventListener('click', function() {
    document.getElementById('usageStatementsPopup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
});

document.getElementById('closeAbout').addEventListener('click', function() {
    document.getElementById('aboutPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('closeUsageStatements').addEventListener('click', function() {
    document.getElementById('usageStatementsPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});

document.getElementById('overlay').addEventListener('click', function() {
    document.getElementById('aboutPopup').style.display = 'none';
    document.getElementById('usageStatementsPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});