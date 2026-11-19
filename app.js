const clock = document.getElementById("clock");
const clockButton = document.getElementById("clockButton");
const dot = document.getElementById("statusDot");
const hint = document.getElementById("micHint");
const clockScreen = document.getElementById("clockScreen");
const answerScreen = document.getElementById("answerScreen");
const backButton = document.getElementById("backButton");
const transcriptEl = document.getElementById("transcript");
const shortAnswer = document.getElementById("shortAnswer");
const longAnswer = document.getElementById("longAnswer");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoScreen = document.getElementById("photoScreen");

let state = "idle";
let recognition = null;
let transcript = "";
let touchStartX = null;

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Barnaul", hour: "2-digit", minute: "2-digit", hour12: false
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 1000);

function setState(next) {
  state = next;
  dot.className = "status-dot " + next;
  hint.textContent = ({idle:"Ожидание", listening:"Микрофон включён", processing:"Обработка", ready:"Ответ готов"})[next];
}

function showAnswer() {
  clockScreen.hidden = true;
  answerScreen.hidden = false;
}
function showClock() {
  answerScreen.hidden = true;
  clockScreen.hidden = false;
}
backButton.addEventListener("click", showClock);

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setState("listening");
    transcriptEl.textContent = "Распознавание речи не поддерживается этим браузером. Откройте прототип в Chrome или Edge и разрешите доступ к микрофону.";
    shortAnswer.textContent = "Голосовой ввод недоступен.";
    longAnswer.textContent = "Можно проверить интерфейс, но для голосового распознавания нужен браузер с поддержкой Web Speech API и разрешение микрофона.";
    showAnswer();
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.continuous = false;
  recognition.interimResults = true;
  transcript = "";
  recognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      finalText += event.results[i][0].transcript;
    }
    transcript = finalText.trim();
    transcriptEl.textContent = transcript || "Слушаю…";
  };
  recognition.onerror = (event) => {
    setState("idle");
    transcriptEl.textContent = "Не удалось распознать речь: " + event.error;
    shortAnswer.textContent = "Попробуй ещё раз и проверь разрешение микрофона.";
    longAnswer.textContent = "В браузере нужно разрешить доступ к микрофону. Некоторые браузеры требуют HTTPS.";
    showAnswer();
  };
  recognition.onend = () => {
    if (state !== "listening" && state !== "processing") return;
    setState("processing");
    transcriptEl.textContent = transcript || "Запрос не распознан.";
    shortAnswer.textContent = "Запрос принят в демонстрационном режиме.";
    longAnswer.textContent = "Голосовой запрос записан: «" + (transcript || "пустой запрос") + "». Настоящий ответ ChatGPT, Gemini или Яндекса пока не генерируется: для этого нужно подключить официальный API через сервер.";
    setState("ready");
  };
  try { recognition.start(); }
  catch(e) {
    setState("idle");
    transcriptEl.textContent = "Не получилось запустить микрофон. Попробуй ещё раз.";
    showAnswer();
  }
}

function stopListening() {
  setState("processing");
  if (recognition) recognition.stop();
  else setState("ready");
}

clockButton.addEventListener("click", () => {
  if (state === "idle" || state === "ready") {
    setState("listening");
    startListening();
  } else if (state === "listening") {
    stopListening();
  }
});

clockScreen.addEventListener("touchstart", (e) => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
clockScreen.addEventListener("touchend", (e) => {
  if (touchStartX !== null && e.changedTouches[0].screenX - touchStartX > 70 && state === "ready") showAnswer();
  touchStartX = null;
}, {passive:true});
clockScreen.addEventListener("wheel", (e) => {
  if (e.deltaX < -40 && state === "ready") showAnswer();
}, {passive:true});

photoInput.addEventListener("change", () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  photoPreview.src = URL.createObjectURL(file);
  photoPreview.hidden = false;
  photoScreen.hidden = false;
  transcriptEl.textContent = "Фотография выбрана: " + file.name;
  shortAnswer.textContent = "Фото готово к отправке после подключения нейросети.";
  longAnswer.textContent = "В этом прототипе можно выбрать и просмотреть фотографию. Она не загружается на сервер и не отправляется в ИИ-сервис.";
});
