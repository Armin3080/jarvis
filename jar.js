const btn = document.querySelector('.talk');
const content = document.querySelector('.content');

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);
    text_speak.rate = 1; // تغییر نرخ صدا به 1 برای سازگاری
    text_speak.volume = 1; // حداکثر حجم صدا را به 1 تغییر دهید
    text_speak.pitch = 1; // تغییر نت صدا به 1
    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    const day = new Date();
    const hour = day.getHours();

    if (hour >= 0 && hour < 12) {
        speak("Good Morning Boss...");
    } else if (hour >= 12 && hour < 17) {
        speak("Good Afternoon Master Armin...");
    } else {
        speak("Good Evening Sir...");
    }
}

window.addEventListener('load', () => {
    speak("Initializing JARVIS...");
    wishMe();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true; // فعال‌سازی شناسایی مداوم
recognition.interimResults = true; // نمایش نتایج میانی

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

btn.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

function takeCommand(message) {
    if (message.includes('hey jarvis') || message.includes('hello jarvis how are you?')) {
        speak("Hello master Armin, How can I Help You today?");
    } else if (message.includes("say it")) {
        speak("ok");
        document.getElementById('myAudio').play(); // پخش فایل صوتی
    } else if (message.includes('how can you help me?')) {
        speak("I can help you with a lot of things like opening apps, searching on the internet, making calls, playing music, and much more.");
    } else if (message.includes('what is your name?')) {
        speak("My name is J.A.R.V.I.S, and I am here to help you.");
    } else if (message.includes('who made you?')) {
        speak("I was created by Armin arbshahi.");
    } else if (message.includes('jarvis')) {
        speak("Yes sir");
    } else if (message.includes('how are you')) {
        speak("I am fine, what about you?");
    } else if (message.includes('i am fine') || message.includes('i am good')) {
        speak("It's good to know that you are fine.");
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
    } else if (message.includes("open p")) {
        window.open("https://pornhub.com", "_blank");
        speak("Opening p...");
    } else if (message.includes("open d")) {
        window.open("https://bongacams.com/--andyy--#!/", "_blank");
        speak("andyy...");
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "This is what I found on the internet regarding " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "This is what I found on Wikipedia regarding " + message;
        speak(finalText);
    } else if (message.includes('what time is it?')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
    } else if (message.includes('what date today?')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
    } else if (message.includes('open calculator')) {
        window.open('Calculator://');
        const finalText = "Opening Calculator";
        speak(finalText);
    } else if (message.includes('open gpt')) {
        window.open('https://chatgpt.com/');
        const finalText = "Opening ChatGPT";
        speak(finalText);
    } else if (message.includes('call')) {
        const contactName = message.split("call")[1].trim();
        const phoneNumber = findPhoneNumber(contactName);

        if (phoneNumber) {
            window.open(`tel:${phoneNumber}`, '_blank');
            speak(`Calling ${contactName}...`);
        } else {
            speak(`Sorry, I don't have the number for ${contactName}.`);
        }
    } else if (message.includes('open instagram')) {
        window.open('instagram://', '_blank');
        speak('Opening Instagram...');
    } else if (message.includes('open camera')) {
        window.open('camera://', '_blank');
        speak('Opening Camera...');
    } else if (message.includes('open gallery')) {
        window.open('gallery://', '_blank');
        speak('Opening Gallery...');
    } else if (message.includes('open telegram')) {
        window.open('tg://', '_blank');
        speak('Opening Telegram...');
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "I found some information for " + message + " on Google";
        speak(finalText);
    }
}

function findPhoneNumber(contactName) {
    const contacts = {
        "john": "",
        "jane": "",
        "fadakar": "09302645236",
        "Farzad": "09906203907",
        "F": "",
        "salar": "09386943161",
        "Hossein": "09379695344",
        // Add more contacts here
    };
    return contacts[contactName.toLowerCase()] || null;
}
