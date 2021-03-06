const { Command } = require('discord-akairo');

class UnstarCommand extends Command {
	constructor() {
		super('unstar', {
			aliases: ['unstar'],
			category: 'starboard',
			channelRestriction: 'guild',
			clientPermissions: ['MANAGE_MESSAGES'],
			args: [
				// Indices are swapped in order to process channel first.
				{
					id: 'channel',
					index: 1,
					match: 'rest',
					type: 'textChannel',
					default: message => message.channel,
					prompt: {
						start: msg => `${msg.author} **::** That channel could not be found. What channel is the message you are trying to remove a star from in?`,
						retry: msg => `${msg.author} **::** Please provide a valid text channel.`,
						optional: true
					}
				},
				{
					id: 'message',
					index: 0,
					type: (word, message, { channel }) => {
						if (!word) return null;
						// eslint-disable-next-line prefer-promise-reject-errors
						return channel.fetchMessage(word).catch(() => Promise.reject());
					},
					prompt: {
						start: msg => `${msg.author} **::** Could not find a message. What is the ID of the message you would like to remove a star from?`,
						retry: (msg, { channel }) => `${msg.author} **::** Oops! I can't find that message in ${channel}. Remember to use its ID.`
					}
				}
			]
		});
	}

	async exec(message, { message: msg }) {
		if (msg.author.id === message.author.id) {
			message.util.reply('You can\'t unstar your own message.');
			return;
		}

		const starboard = this.client.starboards.get(msg.guild.id);

		if (!starboard.initiated) {
			message.util.reply('Starboard has not fully loaded, please wait.');
			return;
		}

		if (!starboard.channel) {
			const prefix = this.client.commandHandler.prefix(message);
			message.util.reply(`There isn't a starboard channel to use. Set one using the \`${prefix}starboard\` command!`);
			return;
		}

		if (!message.channel.permissionsFor(this.client.user).has('MANAGE_MESSAGES')) {
			message.util.reply('I\'m missing `Manage Messages` to unstar that message in this channel.');
			return;
		}

		const missingPerms = starboard.missingPermissions();
		if (missingPerms) {
			message.util.reply(missingPerms);
			return;
		}

		const star = starboard.stars.get(msg.id);

		if (!star || !star.starredBy.includes(message.author.id)) {
			message.util.reply('You can\'t remove any star from this message because you never gave it one in the first place.');
			return;
		}

		const error = await starboard.remove(msg, message.author);
		if (error) {
			message.util.reply(error);
		}
	}
}

module.exports = UnstarCommand;
