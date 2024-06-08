const { Client, GatewayIntentBits, Partials, ApplicationCommandOptionType, EmbedBuilder, MessageEmbed } = require('discord.js');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
//require('dotenv').config();


// Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDBTMH5SzACrkyiXjJKmn646FpZ52te-BE",
  authDomain: "nand-studios.firebaseapp.com",
  databaseURL: "https://nand-studios-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nand-studios",
  storageBucket: "nand-studios.appspot.com",
  messagingSenderId: "757182836081",
  appId: "1:757182836081:web:fcbd06ff53d631bbf7dad0",
  measurementId: "G-NW0JM7YR07"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Discord-Bot initialisieren
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

function updatePresence() {
  client.user.setPresence({
    activities: [{
      name: "Supermarket Simulator V0.4 MP",
      type: "PLAYING"
    }],
    status: "online"
  });
}


//const token = process.env.DISCORD_BOT_TOKEN;

client.once('ready', async () => {
  console.log('Bot is ready!');
  await registerSlashCommands();
  updatePresence();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  //DOWNLOAD COMMAND FUNKTION
  if (commandName === 'download') {
    const gameName = options.getString('game');
    if (gameName) {
      await interaction.deferReply();
      const gameLink = await fetchGameLink(gameName);
      if (gameLink) {
        await interaction.editReply(`Hier ist der Link für ${gameName}: ${gameLink}`);
      } else {
        await interaction.editReply(`Kein Link gefunden für das Spiel: ${gameName}`);
      }
    } else {
      await interaction.reply('Bitte gib den Spielnamen an!');
    }
  }
  async function fetchGameLink(gameName) {
    try {
      const linkDoc = doc(db, 'links', 'linkdoc');
      const docSnap = await getDoc(linkDoc);
      if (docSnap.exists()) {
        const gameLink = docSnap.data()[gameName + 'Download'] || docSnap.data()[gameName.toLowerCase() + 'Download'];
        return gameLink || null;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des Links:', error);
    }
    return null;
  }

  //HELP COMMAND FUNKTION
  if (commandName === 'help') {
    await interaction.deferReply(); // Benachrichtigung, dass der Bot den Befehl verarbeitet
    const gameNames = await fetchGameNames();
    if (gameNames.length > 0) {
      const embed = new EmbedBuilder()
        .setTitle('Verfügbare Spiele')
        .setDescription(gameNames.join('\n'))
        .setColor('#0099ff')
        
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply('Keine Spiele gefunden.');
    }
  }
});
async function fetchGameNames() {
  try {
    const linkDoc = doc(db, 'links', 'linkdoc');
    const docSnap = await getDoc(linkDoc);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return Object.keys(data).filter(key => key.endsWith('Download')).map(key => key.replace('Download', ''));
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Spiele:', error);
  }
  return [];
}

//REGISTER COMMANDS
async function registerSlashCommands() {
  try {
    const commands = [

      //DOWNLOAD COMMAND
      {
        name: 'download',
        description: 'Lädt den Link für das Spiel herunter',
        
        options: [
          {
            name: 'game',
            type: 3,
            description: 'Der Name des Spiels',
            required: true,
          },
        ],
      },

      //HELP COMMAND
      {
        name: 'help',
        description: 'Zeigt alle verfügbaren Spiele',
        type: '1',
      },

    ];
    // Slash-Befehle registrieren
    await client.application.commands.set(commands);
    console.log('Slash-Befehle wurden registriert!');
  } catch (error) {
    console.error('Fehler beim Registrieren der Slash-Befehle:', error);
  }
}

client.login(token);
