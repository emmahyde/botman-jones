const eris = require('eris')

const PREFIX = '!'
const BOT_OWNER_ID = '254422154295115776'
const PREMIUM_CUTOFF = 10
const commandMap = {}
const token = require('./bot.json')

const bot = new eris.Client(token['token'])
const premiumRole = {
  name: 'Premium Member',
  color: 0x6aa84f,
  hoist: true
}

commandMap['addpayment'] = {
  botOwnerOnly: true,
  execute: (msg, args) => {
    const mention = args[0]
    const amount = parseFloat(args[1])
    const guild = msg.channel.guild
    const userId = mention.replace(/<@(.*?)>/, (match, group1) => group1)
    const member = guild.members.find((member) => {
      return member.username === userId
    })

    const userIsInGuild = !!member;
    if (!userIsInGuild) {
      return msg.channel.createMessage('User not found in this channel.')
    }

    const amountIsValid = amount && !Number.isNaN(amount)
    if (!amountIsValid) {
      return msg.channel.createMessage('Invalid donation amount')
    }

    return Promise.all([
      msg.channel.createMessage(`${mention} paid $${amount.toFixed(2)}`),
      updateMemberRoleForDonation(guild, member, amount),
    ])
  }
}

async function updateMemberRoleForDonation(guild, member, donationAmount) {
  if (guild && member && donationAmount >= PREMIUM_CUTOFF) {
    let role = Array.from(guild.roles.values())
        .find(role => role.name === premiumRole.name)
    if (!role) {
      role = await guild.createRole(premiumRole)
    }

    return member.addRole(role.id, 'Donated $10 or more.')
  }
}

// command handler, handles 'no matching command' case
bot.on('messageCreate', async (msg) => {
  const content = msg.content
  if (!content.startsWith(PREFIX)) {
    return
  }

  const parts = content.split(' ').map(s => s.trim()).filter(s => s)
  const commandName = parts[0].substr(PREFIX.length)

  const command = commandMap[commandName]
  if (!command) {
    return
  }

  const authorIsBotOwner = msg.author.id === BOT_OWNER_ID
  if (command.botOwnerOnly && !authorIsBotOwner) {
    return await msg.channel.createMessage(`Hey, fuck you. You are ${msg.author.id}.`)
  }

  const args = parts.slice(1)

  try {
    await command.execute(msg, args)
  } catch (err) {
    console.warn('Error handling command')
    console.warn(err)
  }
})

bot.on('error', err => {
  console.warn(err)
})

bot.connect()