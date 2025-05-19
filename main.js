// Sound effects
const clickSound = { play: () => { console.log('Click sound played'); } };
const responseSound = { play: () => { console.log('Response sound played'); } };

const arcReactorBtn = document.getElementById('arc-reactor-btn');
const voiceVibration = document.getElementById('voice-vibration');
const responseText = document.getElementById('response-text');
const particlesCanvas = document.getElementById('particles');
const ctx = particlesCanvas.getContext('2d');

// Create a single SpeechRecognition instance
let recognition;
try {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'pt-BR';
} catch (e) {
  console.error('Erro ao criar o objeto SpeechRecognition:', e);
  recognition = null;
}

let listening = false;

// Resize canvas to full screen
function resizeCanvas() {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle system
const particles = [];
const maxParticles = 120; // increased particles for richer effect

function createParticle() {
  return {
    x: Math.random() * particlesCanvas.width,
    y: Math.random() * particlesCanvas.height,
    radius: Math.random() * 2 + 1,
    speedX: (Math.random() - 0.5) * 0.7, // slightly faster
    speedY: (Math.random() - 0.5) * 0.7,
    alpha: Math.random() * 0.6 + 0.4, // brighter particles
    colorShift: Math.random() * 100 // for subtle color cycling
  };
}

for (let i = 0; i < maxParticles; i++) {
  particles.push(createParticle());
}

function drawParticles() {
  ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  particles.forEach(p => {
    // subtle color cycling between cyan and teal
    const r = 0;
    const g = 255 - (p.colorShift * 0.5);
    const b = 255;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
    ctx.shadowColor = `rgba(${r},${g},${b},${p.alpha})`;
    ctx.shadowBlur = 8;
    ctx.fill();
    p.x += p.speedX;
    p.y += p.speedY;
    p.colorShift += 0.5;
    if (p.colorShift > 100) p.colorShift = 0;

    if (p.x < 0) p.x = particlesCanvas.width;
    else if (p.x > particlesCanvas.width) p.x = 0;
    if (p.y < 0) p.y = particlesCanvas.height;
    else if (p.y > particlesCanvas.height) p.y = 0;
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// Speech synthesis setup
const synth = window.speechSynthesis;
let voices = [];

function loadVoices() {
  voices = synth.getVoices();
  console.log('Available voices:', voices);
}
loadVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

function getPortugueseVoice() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // On mobile, prefer male pt-BR voice if available
    for (let voice of voices) {
      if (voice.lang === 'pt-BR' && voice.name.toLowerCase().includes('male')) {
        console.log('Selected male pt-BR voice (mobile):', voice.name);
        return voice;
      }
    }
    // Otherwise, fallback to any pt-BR voice
    for (let voice of voices) {
      if (voice.lang === 'pt-BR') {
        console.log('Selected pt-BR voice (mobile):', voice.name);
        return voice;
      }
    }
  } else {
    // Desktop: prefer male pt-BR voice
    for (let voice of voices) {
      if (voice.lang === 'pt-BR' && voice.name.toLowerCase().includes('male')) {
        console.log('Selected male pt-BR voice:', voice.name);
        return voice;
      }
    }
    for (let voice of voices) {
      if (voice.lang === 'pt-BR') {
        console.log('Selected pt-BR voice:', voice.name);
        return voice;
      }
    }
  }
  for (let voice of voices) {
    if (voice.lang.startsWith('pt')) {
      console.log('Selected pt voice:', voice.name);
      return voice;
    }
  }
  console.log('Selected default voice:', voices[0]?.name);
  return voices[0];
}

function speak(text) {
  if (synth.speaking) {
    console.log('SpeechSynthesis is speaking, cancelling...');
    synth.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = getPortugueseVoice();
  utterance.lang = 'pt-BR';
  utterance.rate = 1.5;
  utterance.pitch = 1.0;
  // Lower volume on mobile devices
  utterance.volume = /Mobi|Android/i.test(navigator.userAgent) ? 0.6 : 1.0;
  utterance.onstart = () => console.log('Speech started');
  utterance.onend = () => {
    console.log('Speech ended');
    hideResponse();
    listening = false;
  };
  utterance.onerror = (event) => {
    console.error('SpeechSynthesis error:', event.error);
    listening = false;
  };
  synth.speak(utterance);
}

function showVoiceVibration() {
  voiceVibration.classList.remove('hidden');
}

function hideVoiceVibration() {
  voiceVibration.classList.add('hidden');
}

function showResponse(text) {
  responseText.textContent = text;
  responseText.classList.add('visible');
  responseText.classList.remove('hidden');
}

function hideResponse() {
  responseText.classList.remove('visible');
  responseText.classList.add('hidden');
  responseText.textContent = '';
}

function startListeningAnimation() {
  arcReactorBtn.classList.add('listening');
  showVoiceVibration();
}

function stopListeningAnimation() {
  arcReactorBtn.classList.remove('listening');
  hideVoiceVibration();
}

// Add ripple effect on click
arcReactorBtn.addEventListener('click', () => {
  console.log('Botão pressionado');
  if (listening) {
    console.log('Já está ouvindo, ignorando clique');
    return;
  }
  if (!recognition) {
    console.error('SpeechRecognition não é suportado neste navegador.');
    showResponse('Seu navegador não suporta reconhecimento de voz.');
    return;
  }
  listening = true;
  clickSound.play();

  // Add ripple class to trigger animation
  arcReactorBtn.classList.add('ripple');
  setTimeout(() => {
    arcReactorBtn.classList.remove('ripple');
  }, 600);

  startListeningAnimation();

  recognition.start();
});

recognition.onresult = (event) => {
  const spokenText = event.results[0][0].transcript;
  console.log('Texto reconhecido:', spokenText);
  stopListeningAnimation();
  showResponse('Processando...');
  processQuestion(spokenText);
};

recognition.onerror = (event) => {
  console.error('Erro no reconhecimento de voz:', event.error);
  showResponse('Erro no reconhecimento de voz: ' + event.error);
  stopListeningAnimation();
  listening = false;
};

recognition.onend = () => {
  console.log('Reconhecimento de voz finalizado');
  if (listening) {
    stopListeningAnimation();
    listening = false;
  }
};

function processQuestion(text) {
  const problemas = [
    {
      keywords: ["luz", "não acende", "nao acende", "lâmpada", "lampada"],
      resposta: "Verifique se a lâmpada está queimada ou se há disjuntor desarmado."
    },
    {
      keywords: ["tomada", "sem energia", "não funciona", "nao funciona"],
      resposta: "Pode ser um fio solto ou disjuntor desligado. Verifique com um multímetro."
    },
    {
      keywords: ["disjuntor", "desarma", "desligando", "desligou"],
      resposta: "Pode haver curto-circuito ou sobrecarga. Revise os circuitos ligados."
    },
    {
      keywords: ["fio", "queimado", "fiação", "curto-circuito", "curto circuito"],
      resposta: "Verifique a fiação para identificar possíveis fios queimados ou curto-circuitos."
    },
    {
      keywords: ["interruptor", "não funciona", "nao funciona", "botão"],
      resposta: "Pode ser um interruptor com defeito ou mau contato. Teste ou substitua o interruptor."
    },
    {
      keywords: ["lâmpada", "pisca", "piscando", "intermitente"],
      resposta: "Pode ser um problema na lâmpada ou na fiação. Verifique conexões e substitua a lâmpada se necessário."
    },
    {
      keywords: ["energia", "queda", "oscilação", "queda de energia"],
      resposta: "Pode ser problema na rede elétrica ou no disjuntor. Consulte a companhia elétrica se persistir."
    },
    {
      keywords: ["motor", "aquecendo", "esquentando", "superaquecimento"],
      resposta: "Motor aquecendo pode indicar sobrecarga, ventilação insuficiente ou problemas nos rolamentos. Verifique a corrente, ventilação e lubrificação."
    },
    {
      keywords: ["transformador", "ruído alto", "barulho", "zumbido"],
      resposta: "Ruído alto em transformador pode ser folga mecânica, sobrecarga ou problemas no núcleo magnético. Verifique carga e conexões."
    },
    {
      keywords: ["motor", "vibrando", "vibração excessiva"],
      resposta: "Vibração no motor pode ser desbalanceamento, desalinhamento, problemas nos rolamentos ou base inadequada. Verifique fixação e alinhamento."
    },
    {
      keywords: ["motor", "corrente alta", "consumo elevado"],
      resposta: "Corrente alta no motor pode indicar sobrecarga mecânica, problemas elétricos ou tensão incorreta. Verifique carga e tensão de alimentação."
    },
    {
      keywords: ["motor", "ruído", "rolamento", "barulho rolamento"],
      resposta: "Ruído no rolamento do motor indica desgaste ou falta de lubrificação. Recomenda-se substituição do rolamento."
    },
    {
      keywords: ["motor monofásico", "não parte", "alta corrente", "não arranca"],
      resposta: "Motor monofásico não partir com alta corrente pode ser capacitor defeituoso, problema no enrolamento ou carga travada. Verifique capacitor e rotação manual."
    },
    {
      keywords: ["contator", "ruído alto", "barulho", "vibração"],
      resposta: "Ruído no contator pode ser núcleo magnético sujo ou desgastado, ou tensão da bobina inadequada. Verifique limpeza e tensão de operação."
    },
    {
      keywords: ["contator", "não liga", "sem passagem", "entrada saída"],
      resposta: "Contator não ligando entrada com saída pode ser bobina queimada, contatos soldados ou problema no comando. Verifique tensão na bobina e estado dos contatos."
    }
  ];

  let resposta = "Desculpe, não entendi o problema. Tente descrever de outra forma.";
  const pergunta = text.toLowerCase();

  for (let problema of problemas) {
    if (problema.keywords.some(keyword => pergunta.includes(keyword))) {
      resposta = problema.resposta;
      break;
    }
  }

  showResponse(resposta);
  responseSound.play();
  speak(resposta);
}
