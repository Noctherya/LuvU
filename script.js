// 1. Supabase Verbindung
const supabaseUrl = 'https://gessrezpwqmdajkfxgjk.supabase.co';
const supabaseKey = 'sb_publishable_NlYgPe1Ii47nl0-anpcnSA_75ae85U9';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Deine Briefe (bleiben unverändert im Code)
const letters = [
  {
    title: "you first open this app",
    body: "hey baby,\n\nif you're reading this, you just opened our little app for the first time. i built it for you – with love, a little bit of chaos, and a whole lot of me in it. I thought if you could do it, why not me? Soo this is what I came up with randomly at work and I personally love that idea.\n\nlook around. there are letters here for you. for every moment you need me. Bare with me but I'm really trying my best over here. Just overlook any bugs you might find throughout this whole thing - upsi.\n\ni love you.",
    media: []
  },
  {
    title: "when you can't sleep",
    body: "hey baby,\n\nif you're reading this, it means the night is too long and your head is too loud. i wish i could be there right now. i would wrap my arms around you, pull you close, and just hold you until you fall asleep.\n\nsince i can't do that right now, i want you to close your eyes for a second. imagine i'm right there next to you. imagine my hand on your chest, feeling your heartbeat slow down. imagine me whispering that everything is going to be okay, because it is. you are safe. you are loved. \n\nstop thinking about tomorrow. just breathe. i'm right here, even if it's just in my thoughts. i love you. sleep well, my love.",
    media: []
  },
  {
    title: "you need a laugh",
    body: "okay, here's your official \"please laugh now\" letter:\n\nwhy can't programmers have relationships?\nbecause they always ask for a \"commit\" but never say \"yes\" (tot unlustig tu einfach so als hättest du gelacht).\n\nand if that didn't work: just think about my face when i am concentrating on something or you successfully ragebait me.  that's funny enough.\n\ni love you, you Mr. Ragebaiter (like seriously I love you).",
    media: []
  },
  {
    title: "when you feel like you're not enough",
    body: "hey you,\n\ni know you have days where you doubt yourself. where you think you're not doing enough, not being enough. i see it in the way you get quiet sometimes. but i need you to read this very carefully:\n\nyou are more than enough. exactly as you are.\n\ni see how hard you try. i see how you fight for us, how you try to be a better person for me. i see your patience with me, even when i'm difficult. do you have any idea how rare that is?\n\nyou are not a burden. you are not too much. you are my safe place, my calm in the chaos. i am so incredibly proud to call you mine. never doubt that for a second. you are everything i ever wished for, and i'm not going anywhere. i love you, all of you.",
    media: []
  },
  {
    title: "you need a smile",
    body: "remember that day we first met? i think about it a lot. Actually I think about YOU 24/7 so don't you DARE say I'm not obsessed with you - because I am. Entirely. Your fault for being everything I ever wished for.\n\nand about the way how nervous we both were like the whole time, now I feel the safest and calmest when I'm with you. You're my safe place in human form and I couldn't be any happier.\n\ni hope this letter put a little smile on your face. you deserve to smile, always. Because you love my smile and I love yours so we're even.",
    media: []
  },
  {
    title: "when you're overthinking",
    body: "hey darling,\n\nis your head spinning right now? are you stuck in a loop of 'what ifs' and 'maybes'? i know that feeling. and i know how exhausting it is.\n\nlet me take some of that weight off your shoulders. whatever you are worrying about right now, we will figure it out. we always do. you don't have to have all the answers today.\n\nwhen my head gets too loud, i think of you. i think about how calm i feel when you hold me. try to do the same. think of my hand in yours. breathe in for 4 seconds, hold it, and breathe out. i am here. i'm not going anywhere. we are okay.",
    media: []
  },
  {
    title: "when you need a reminder",
    body: "hey you,\n\ni just wanted to remind you of a few things. \n\nfirst: you are the best thing that happened to me. second: you make me so incredibly happy, even from miles away. third: i think about you literally all the time, even when i'm doing boring things like grocery shopping.\n\nwe haven't known each other for years, but i already know that you are my person. you are the one i want to tell everything to. the good, the bad, the weird. i feel so safe with you, and i hope you know that you can be your completely true, unfiltered self with me too.\n\ni love you. always.",
    media: []
  },
  {
    title: "when you're proud of me",
    body: "hey my love,\n\nif you are reading this, it means i did something and you are proud of me. (Or maybe you're just reading this because you're curious - either way, hiiiii!).\n\ni know i can be a lot sometimes. i know i have my ups and downs, and sometimes i get insecure or overwhelmed. but you never make me feel like i'm too much. you just hold my hand and tell me you're proud of me, and honestly? that means more to me than you will ever know.\n\nthank you for being my biggest supporter. for believing in me even when i don't believe in myself. i hope i make you as proud as you make me. i love you so much.",
    media: []
  },
  {
    title: "u miss ur little Pelzball",
    body: "hey baby,\n\ni know how much you miss Loui. i know there are days where the house feels too quiet and you would give anything to just hear those little paws on the floor again.\n\njust remember: he's not alone up there. he's playing with my babies. they are running around together, chasing each other, and probably causing a little bit of chaos. they are keeping each other company until we can see them again.\n\nhe knew how much you loved him. he still knows. and i'm sure he's looking down at you, wagging his tail, so proud of the person you are. i'm here for you, always. i love you.(hab geheult als ich das geschrieben hab)",
    media: []
  },
{
  title: "you're trying to protect me",
  body: "hey my love,\n\ni know you would fight the whole world for me. i see how you try to make sure i'm okay, how you want to keep me safe from everything.\n\nbut you don't have to carry the weight of the whole world alone. you are allowed to be the one who needs protection too. you can let your guard down with me. i've got you, just like you've got me. you don't have to be my knight in shining armor all the time. you can just be sebo. and i love sebo.",
  media: []
},
  {
    title: "u just need to hear this",
    body: "hey you,\n\nif you're reading this, i need you to stop whatever you're doing for a second and just listen. \n\ni love you. not because you're perfect, not because you always do everything right, but because you're you. because you make me feel safe. because you make me laugh. because you are the person i want to talk to at the end of every day.\n\nyou are doing so much better than you think you are. you are enough, exactly as you are right now in this moment. and i am so incredibly lucky to call you mine. \n\nnow take a deep breath. and remember that i'm thinking of you.",
    media: []
  },
  {
    title: "u're thinking about us",
    body: "hey my love,\n\ndo you ever think about how crazy this all is? how we found each other in this huge, chaotic world? i do. all the time. \n\ni think about how lucky i am that you are patient with me. i think about how safe i feel when you tell me you love me. i think about the way you make me feel seen, even through a screen. \n\ni know the distance is hard. i know there are days where it feels like too much. but when i think about us, i don't see the distance. i see our future. i see us laughing together, cooking together, falling asleep in each other's arms. \n\nyou are worth every single mile. i love you more than words can say.",
    media: []
  },
  {
    title: "you miss me",
    body: "i miss you too. a lot.\n\nsometimes the distance is hard, but you know what? you're with me in every moment. in my thoughts, in my heart, in the song i'm listening to right now, like literally every song is somehow connected to you.\n\nthis letter is my little way of telling you: i'm here. even when i'm not physically with you.\n\ni'm counting the days until i see you again. You know that. and until then: open this letter as often as you want. it stays here for you. That's why I did this whole thing. Reread it as many times as you need to. Or call me. Or text me. Idc - I'll always answer if it's you, no matter what situation I'm in.\n\ni love you so so so much Darling.",
    media: []
  },
  {
    title: "when you had a bad day",
    body: "hey baby,\n\ni'm so sorry today was shit. i wish i could be there right now to just hold you and make it better. i know sometimes the world is just too loud and everything feels like too much.\n\nbut listen to me: you don't have to carry this alone. you don't have to be strong all the time. it's okay to be overwhelmed. it's okay to just exist today.\n\ntake a deep breath. drink some water. and remember that i am so incredibly proud of you, no matter what happened today. tomorrow is a new day, and i'll be right by your side. i love you more than anything.",
    media: []
  },
{ 
  title: "you are upset or angry (but not at me)", 
  body: "hey my love,\n\ni can tell you're not having a good time right now. and i'm so sorry. i wish i could take whatever is bothering you and throw it away.\n\nyou don't have to talk about it if you don't want to. you can just be angry. you can just be quiet. i'm not going anywhere.\n\nwhen you're ready and u wanna talk about it, I'm always there to listen to you, no matter how small you might think it is. Just tell me. Like who's the person we hate and why? Cuz I'm going all in, if you don't like em, we don't like em. Or if u're disappointed in someone - I'd gladly listen to what happened. Or we can yap about anything till you forget about it. i love you.", 
  media: [] 
},
{ 
  title: "you're bored", 
  body: "hello there,\n\nare you bored? because i'm literally always here to entertain you. \n\nso here is your task: close your eyes and think about the last time we kissed. think about how it felt, how you held me, and how i looked at you afterwards. \n\ndid it work? are you still bored? if yes, just text me. i'll find something stupid to send you. Or we can talk about literally anything, oooor I can reel spam you again, not that I would ever complain about doing it, it's my fav hobby to find things to send to you. i love you.", 
  media: [] 
},
{ 
  title: "you need to feel my love", 
  body: "hey sebo,\n\ni need you to stop whatever you're doing right now and just feel and read this.\n\ni love you. deeply. completely. i love the way you talk, the way you walk, the way you treat me. i love that you are mine. The way that everything you do for me feels so natural and not forced in the slightest. that you show me that YOU love me too. That you care for me even though I always say I can take care of myself - I hate people treating me differently for the way my head works but you see...me. Not the disordered me but me and that is so much more I could've ever asked for. \n\neven when we are miles apart, my love for you is right there. it's not going anywhere. you are so incredibly loved and cherished, and appreciated. God I'm so grateful for whoever made me find you. Because you are the part of my day I look forward when going to bed, waking up, working. I wake up happy because I know you'll be there. I know you'll be there to listen to me when I don't want to talk to anyone but you. don't ever forget it.", 
  media: [] 
},
{ 
  title: "you're feeling down", 
  body: "hey baby,\n\ni know things feel heavy right now. i know you're probably in your head about something. but i need you to know that whatever it is, it's not bigger than us.\n\nyou are strong. you are capable. and you are so, so loved. i am so proud of the man you are. take a deep breath. i'm holding your hand from here, hugging you telepathically. Just hug Bruno tightly, he's a part of me I gifted you in times i can't be there with you physically, so basically you're hugging me! i love you.", 
  media: [] 
},
{ 
  title: "you need a pep talk", 
  body: "listen to me very carefully: you are sebo. you are 24 years old, you are smart, you are funny, you are capable, and you are literally the best thing that happened to me. \n\nwhatever you are doubting right now, it's a lie. you can do this. you can handle whatever is in front of you. and if you can't, that's okay too, because i'll be right here to catch you. It worked out? I'mma be soon proud of you. It didn't work out? I'm incredibly proud of you for trying even though I know you doubted yourself from the beginning. so there's nothing to be afraid of. No matter the outcome - I'll be there for you. now go out there and do whatever your head is breaking over right now.", 
  media: [] 
},
{ 
  title: "you're stressed out", 
  body: "hey baby,\n\nstop. breathe. just for a second. \n\nwhatever is stressing you out right now, it's not the end of the world. you don't have to solve everything today. you just have to get through today. and you will. \n\nimagine my hands on your shoulders, pulling you into a tight hug. Mwah mwah - ing your whole face till you smile again. that's what i would do if i was there. i love you. you're doing great.", 
  media: [] 
},
{ 
  title: "you need a lift", 
  body: "hey you,\n\nyou need a little boost? here it is: \n\nyou are the most attractive, the most patient, and the most loving person i have ever met. i love you so much that it sometimes scares me. you have no idea how much you mean to me. And I genuinely mean that, there aren't even enough words in this world to describe how much my heart aches for you and how much you mean to me. All the videos about you being my 11:11, my blown out candles and birthdays, my lucky lashes - I really mean them. you're everything I ever dreamed about, didn't know you'd be it but I'm so so happy out of all 8 Billion people - it's you.  \n\nnow go and conquer the rest of your day. i'm cheering for you.", 
  media: [] 
},
{ 
  title: "you don't feel handsome", 
  body: "hey sebo,\n\nare you looking in the mirror and not liking what you see? because i can tell you right now, that is a lie.\n\nyou are the most handsome man i know. but it's not just your face, it's your heart. it's how you treat me. it's the way you look at me like i'm the only girl in the world. \n\nto me, you are perfect. exactly as you are. don't forget that. (You look fucking handsome overall tho)", 
  media: [] 
},
{
  title: "when we're on a call and we're both quiet",
  body: "hey my love,\n\ni don't know if you've ever noticed this, but my absolute favorite moments with you aren't always the ones where we're talking non-stop. don't get me wrong, i love our deep conversations and i love it when you make me laugh until my stomach hurts. but there is something so incredibly special about the silence.\n\nwhen we're on the phone and neither of us is talking... you're just doing your thing, i'm doing mine, and we're just existing together in this little bubble of quiet. there is no pressure to fill the space. there is no awkwardness, we just send each other reels or doomscroll or whatever. it's just... peaceful.\n\ni think that's when i feel the closest to you. because in those moments, i don't have to be entertaining. i don't have to be the 'fun' version of myself. i can just be me, with my messy thoughts and my quiet breathing, and i know you're on the other end, just being you.\n\nit makes me realize how safe i feel with you. being able to sit in silence with someone and feel completely at home - that's what I love most. and that's exactly what you are to me. my home.\n\ni hope you know that even in the silence, i'm thinking about how much i love you. i'm thinking about how lucky i am that i found someone who doesn't need me to fill the quiet. i'm thinking about our future, where we won't have to rely on a call to share the silence - we'll just be in the same room, doing our own thing, and it will be the best feeling in the world.\n\nso the next time we're on a call and it gets quiet, don't feel like you have to say something. just know that i'm smiling on the other end, feeling so incredibly grateful that you exist.\n\ni love you. even in the silence.",
  media: []
},
{ 
  title: "you're sick", 
  body: "hey baby,\n\nare you sick? because if you are, i wish i could be there right now to take care of you. i would make you soup, cuddle you, and complain when you give me your germs (but secretly love it).\n\nrest, drink water, and just let yourself be sick for a while. i'm sending you lots of virtual hugs and kisses. Get some rest, sleep. I'm the least thing you should worry about right now and so is everyone else. Just focus on yourself now, okay? get well soon, my love.", 
  media: [] 
},
];

// 3. App-Logik
document.addEventListener('DOMContentLoaded', async () => {
  
  // LOGIN
  let currentUser = localStorage.getItem('luvu_user');
  if (!currentUser) {
    const loginScreen = document.createElement('div');
    loginScreen.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:#f7f0e8; z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:"Cormorant Garamond", serif;';
    loginScreen.innerHTML = `
      <h1 style="font-family:'Caveat', cursive; color:#9b6b7a; font-size:3rem; margin-bottom:20px;">Wer bist du?</h1>
      <button id="loginAly" style="margin:10px; padding:15px 40px; font-size:1.2rem; background:#9b6b7a; color:white; border:none; border-radius:30px; cursor:pointer; font-family:inherit;">Aly</button>
      <button id="loginSebo" style="margin:10px; padding:15px 40px; font-size:1.2rem; background:#c9a9b4; color:white; border:none; border-radius:30px; cursor:pointer; font-family:inherit;">Sebo</button>
    `;
    document.body.appendChild(loginScreen);
    document.getElementById('loginAly').addEventListener('click', () => { localStorage.setItem('luvu_user', 'Aly'); window.location.reload(); });
    document.getElementById('loginSebo').addEventListener('click', () => { localStorage.setItem('luvu_user', 'Sebo'); window.location.reload(); });
    return;
  }

  // SUCHE NACH DEN BRIEFEN (Wichtig für die Anzeige)
  const envelopeContainer = document.getElementById('envelopes');
  const letterView = document.getElementById('letterView');
  const letterTitle = document.getElementById('letterTitle');
  const letterBody = document.getElementById('letterBody');
  const closeBtn = document.getElementById('closeBtn');

  if (envelopeContainer) {
    envelopeContainer.innerHTML = '';
    letters.forEach((letter, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'envelope-wrap';
      wrap.innerHTML = `
        <div class="envelope">
          <div class="paper">💌</div>
          <div class="flap"></div>
          <div class="pocket"></div>
          <div class="seal">🐧</div>
          <div class="envelope-title">${letter.title}</div>
        </div>
      `;
      wrap.addEventListener('click', () => {
        letterTitle.textContent = letter.title;
        letterBody.innerHTML = letter.body;
        letterView.classList.add('open');
      });
      envelopeContainer.appendChild(wrap);
    });
  }
  if (closeBtn && letterView) closeBtn.addEventListener('click', () => letterView.classList.remove('open'));

  // --- PLUS BUTTON MENÜ ---
  const fab = document.createElement('div');
  fab.innerHTML = '+';
  fab.style.cssText = 'position:fixed; bottom:20px; right:20px; width:60px; height:60px; background:#9b6b7a; color:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-size:35px; box-shadow:0 4px 10px rgba(0,0,0,0.3); cursor:pointer; z-index:1000; transition:transform 0.2s;';
  document.body.appendChild(fab);

  const menu = document.createElement('div');
  menu.style.cssText = 'position:fixed; bottom:90px; right:20px; display:none; flex-direction:column; gap:10px; z-index:1000;';
  menu.innerHTML = `
    <button onclick="openUpload('secret')" style="padding:10px 20px; border-radius:20px; border:none; background:white; color:#9b6b7a; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); cursor:pointer; text-align:left;">✨ Secret</button>
    <button onclick="openUpload('us')" style="padding:10px 20px; border-radius:20px; border:none; background:white; color:#9b6b7a; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); cursor:pointer; text-align:left;">📸 Us Moment</button>
    <button onclick="openUpload('myday')" style="padding:10px 20px; border-radius:20px; border:none; background:white; color:#9b6b7a; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); cursor:pointer; text-align:left;">☀️ Day Moment</button>
    ${currentUser === 'Aly' ? `<button onclick="openUpload('letter')" style="padding:10px 20px; border-radius:20px; border:none; background:white; color:#9b6b7a; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); cursor:pointer; text-align:left;">💌 Brief</button>` : ''}
  `;
  document.body.appendChild(menu);

  fab.addEventListener('click', () => {
    if (menu.style.display === 'none') {
      menu.style.display = 'flex';
      fab.style.transform = 'rotate(45deg)';
    } else {
      menu.style.display = 'none';
      fab.style.transform = 'rotate(0deg)';
    }
  });

  // --- UPLOAD FENSTER ---
  const uploadView = document.createElement('div');
  uploadView.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center; z-index:2000;';
  uploadView.innerHTML = `
    <div style="background:white; padding:20px; border-radius:20px; width:90%; max-width:400px;">
      <h3 id="uploadTitle" style="margin-bottom:15px; color:#9b6b7a; font-family:'Caveat', cursive; font-size:1.8rem;">Neuer Eintrag</h3>
      <input type="text" id="uploadTitleInput" placeholder="Titel (für Briefe)" style="display:none; width:100%; margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:10px;">
      <textarea id="uploadText" placeholder="Dein Text..." style="display:none; width:100%; margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:10px; height:80px;"></textarea>
      <input type="date" id="uploadDate" style="display:none; width:100%; margin-bottom:10px; padding:10px; border:1px solid #ccc; border-radius:10px;">
      <input type="file" id="uploadImage" accept="image/*" style="display:none; width:100%; margin-bottom:15px;">
      <div style="display:flex; gap:10px;">
        <button onclick="closeUpload()" style="flex:1; padding:10px; background:#eee; border:none; border-radius:10px;">Abbrechen</button>
        <button id="uploadBtn" style="flex:1; padding:10px; background:#9b6b7a; color:white; border:none; border-radius:10px;">Hochladen</button>
      </div>
    </div>
  `;
  document.body.appendChild(uploadView);

  let currentUploadType = '';
  window.openUpload = (type) => {
    currentUploadType = type;
    menu.style.display = 'none';
    fab.style.transform = 'rotate(0deg)';
    uploadView.style.display = 'flex';
    
    document.getElementById('uploadTitleInput').style.display = 'none';
    document.getElementById('uploadText').style.display = 'none';
    document.getElementById('uploadDate').style.display = 'none';
    document.getElementById('uploadImage').style.display = 'none';
    
    document.getElementById('uploadTitleInput').value = '';
    document.getElementById('uploadText').value = '';
    document.getElementById('uploadDate').value = '';
    document.getElementById('uploadImage').value = '';

    if (type === 'secret') {
      document.getElementById('uploadTitle').innerText = 'Neues Secret';
      document.getElementById('uploadText').style.display = 'block';
    } else if (type === 'us') {
      document.getElementById('uploadTitle').innerText = 'Neuer Us Moment';
      document.getElementById('uploadImage').style.display = 'block';
    } else if (type === 'myday') {
      document.getElementById('uploadTitle').innerText = 'Neuer Day Moment';
      document.getElementById('uploadDate').style.display = 'block';
      document.getElementById('uploadText').style.display = 'block';
      document.getElementById('uploadImage').style.display = 'block';
    } else if (type === 'letter') {
      document.getElementById('uploadTitle').innerText = 'Neuer Brief';
      document.getElementById('uploadTitleInput').style.display = 'block';
      document.getElementById('uploadText').style.display = 'block';
    }
  };

  window.closeUpload = () => { uploadView.style.display = 'none'; };

  document.getElementById('uploadBtn').addEventListener('click', async () => {
    const titleInput = document.getElementById('uploadTitleInput').value;
    const textInput = document.getElementById('uploadText').value;
    const dateInput = document.getElementById('uploadDate').value;
    const file = document.getElementById('uploadImage').files[0];
    const btn = document.getElementById('uploadBtn');
    
    btn.innerText = 'Lädt...';
    btn.disabled = true;

    try {
      let imageUrl = '';
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      let content = textInput;
      if (currentUploadType === 'letter') {
         content = JSON.stringify({ title: titleInput, body: textInput });
      }

      let createdAt = new Date().toISOString();
      if (currentUploadType === 'myday' && dateInput) {
         createdAt = new Date(dateInput).toISOString();
      }

      const { error } = await supabase.from('moments').insert([{ 
        type: currentUploadType, 
        content: content, 
        image_url: imageUrl,
        author: currentUser,
        created_at: createdAt
      }]);
      
      if (error) throw error;
      alert("Erfolgreich hochgeladen! 🎉");
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Fehler beim Hochladen! 🥺");
      btn.innerText = 'Hochladen';
      btn.disabled = false;
    }
  });
});
