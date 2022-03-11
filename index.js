const adventure = require('./histoire.json');
const sqlite3 = require('sqlite3').verbose();
const Discord = require('discord.js');
const bot = new Discord.Client();
bot.login('insert token');
const prefix = 'rp!';

function Story(db, message) {
  db.close(()=> {
  db = new sqlite3.Database('./database.db');
  db.get(`SELECT * FROM users WHERE discordId = ${message.author.id}`, [], (err, rows) => {
      let lvl = rows.stage;
      if (lvl == 0) {
        let winembed = new Discord.MessageEmbed().setTitle("Malheureusement, j'ai le déplaisir de vous annoncer que vous avez fini le jeu.").setDescription("Vous pouvez toujours essayer de finir autrement en relançant une partie avec `rp!new`").setColor(0x32CD32)
        return message.channel.send(winembed);
      }
      if (adventure[lvl] == undefined) return message.channel.send("Erreur de la base de donnée de l'histoire: Lien vers une partie inexistante");
      let embed = new Discord.MessageEmbed().setDescription(adventure[lvl].story).setColor(0x006400)
      if (adventure[lvl].choices == 2) 
      Question(message, embed, ()=> {
        console.log("1")
        db.run(`UPDATE users SET stage = ${adventure[lvl]["1"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      }, ()=> {
        console.log("2")
        db.run(`UPDATE users SET stage = ${adventure[lvl]["2"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      });
      else if (adventure[lvl].choices == 3) 
      Question(message, embed, ()=> {
        console.log("1")
        db.run(`UPDATE users SET stage = ${adventure[lvl]["1"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          console.log("vivant")
          Story(db, message);
        })
      }, ()=> {
        console.log("2")
        db.run(`UPDATE users SET stage = ${adventure[lvl]["2"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      }, ()=> {
        console.log("3")
        db.run(`UPDATE users SET stage = ${adventure[lvl]["3"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      });
      else if (adventure[lvl].choices == 1)  {
        message.channel.send(embed);
        db.run(`UPDATE users SET stage = ${adventure[lvl]["1"]} WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      }
      else message.channel.send("Erreur de la base de donnée de l'histoire : Nombre de choix inpossible (moins de 1 ou plus de 3)")
    })
})
}

function Question (message, messageObject , function1, function2, function3) {
  message.channel.send(messageObject).then(q => {
    q.react('1️⃣');
    q.react('2️⃣');
    if (function3) q.react('3️⃣');
    q.awaitReactions((reaction, user) => 
    (user.id === message.author.id) && (((function3) && reaction.emoji.name === '3️⃣') || reaction.emoji.name === '1️⃣' || reaction.emoji.name === '2️⃣'),{max:1,time:60000,errors:['time']}).then((collected)=> {
      if (collected.first().emoji.name == '1️⃣') return function1(message);
      if (collected.first().emoji.name == '2️⃣') return function2(message);
      if (collected.first().emoji.name == '3️⃣') return function3(message);
    }, () => {
      let embed = new Discord.MessageEmbed()
      .setTitle(`Désolé ${message.author.username}, mais le message a expiré`)
      .setDescription("Pour continuer votre aventure, veuillez écrire `rp!play`")
      .setColor(0xd10035);
      q.reactions.removeAll()
      q.edit(embed)
    })
  })
}

bot.on('ready', () => {
    console.log("Ca fonctionne")
})

bot.on('message', (message)=> {
  if (!message.content.startsWith(prefix)) return;
  let args = message.content.split("").splice(prefix.length).join("").split(" "); // a modifier
  if (args[0] == 'help') {
    let embed = new Discord.MessageEmbed()
    .setColor(0x28DF28)
    .setTitle("MENU D'AIDE")
    .setDescription("Ici, vous pouvez voir toute les commandes qui existent.")
    .addField("rp!help","Pour avoir ce menu")
    .addField("rp!new","Pour commencer une nouvelle aventure. ATTENTION : SI VOUS FAITES CETTE COMMANDE, TOUT VOTRE PROGRES SERA SUPPRIME")
    .addField("rp!play","pour continuer votre aventure")
    message.channel.send(embed)
  }
  else if (args[0] == 'new') {
    let db = new sqlite3.Database('./database.db');
    db.get(`SELECT * FROM users WHERE discordId = ${message.author.id}`, [], (err, rows) => {
      if (err) throw err;
      if (rows == undefined) {
        db.run(`INSERT INTO users (discordId, stage) VALUES (${message.author.id}, 1)`, [], (err) => {
          Story(db, message);
        });
      } else {
        db.run(`UPDATE users SET stage = 1 WHERE discordId = ${message.author.id}`, [], (err) => {
          Story(db, message);
        })
      }
    })
    db.close();
  }
  else if (args[0] == 'play') {
    let db = new sqlite3.Database('./database.db');
    db.get(`SELECT * FROM users WHERE discordId = ${message.author.id}`, [], (err, rows) => {
      if (rows == undefined) return message.channel.send(new Discord.MessageEmbed().setColor(0xd10035).setTitle("You don't have a game yet").setDescription("Please type `rp!new` to create a new game"));
      Story(db, message);
    })
    db.close();
  }
  else if (args[0] == 'qtest')  {
    Question(message, "test?", (message)=>{message.channel.send("you answered 1")},(message)=>{message.channel.send("you answered 2")})
  }
  else return message.channel.send("cette commande n'existe pas")
})