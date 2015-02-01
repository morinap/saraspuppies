/*

TODO:
* Just preload a bunch of images instead of making an image request each time
* Error handling

*/

// Load some requires
var Twit = require('twit');							// Twitter Client
var GoogleImages = require("google-images");		// Google Image Search


// Define our bot class
function SarasPuppies(options) {
	// Init twitter client
	this.twitter = new Twit(require(options.config));
	this.screenname = options.screenname;
};
SarasPuppies.prototype = {
	// The regular expression for tweets to find
	REGEX: /(pug|puppy|puppies)/i,

	/**
	 * Utility to get a random integer
	 */
	rand: function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	},

	/**
	 * Do the bot work
	 */
	skynet: function() {
		// Timeline stream
		var self = this;
		var stream = this.twitter.stream("user", { with: "followings" })
		stream.on("tweet", function(tweet) {
			// Match
			var matches = self.REGEX.exec(tweet.text);

			// Be careful not to reply to our own tweets
			if (matches && tweet.user.screen_name != self.screenname) {
				self.findImage(matches[0], tweet);
			}
		});
	},

	/**
	 * Find a pug image
	 */
	findImage: function(searchTerm, respondTo) {
		// Pick a random page number for search results
		// TODO: This should probably figure out number of pages and go from there, but I think
		// for now we can safely assume there are at least 50 pages
		var self = this;
		var page_num = this.rand(0, 50);
		console.log("Searching Google Images for " + searchTerm + " at page " + page_num);

		GoogleImages.search(searchTerm, {
			page: page_num,
			callback: function(err, images) {
				// Pull off a random image and handle that
				if (images.length > 0) {
					var index = self.rand(0, images.length);
					self.tweetImage(images[index], searchTerm, respondTo);
				} else {
					console.log("No images found");
				}
			}
		});
	},

	/**
	 * Tweet a pug image
	 */
	tweetImage: function(image, searchTerm, respondTo) {
		// Build status text
		console.log("Replying to tweet " + respondTo.id + " from user " + respondTo.user.screen_name + " with URL " + image.url);
		var statusText = "@" + respondTo.user.screen_name + " " + searchTerm.toUpperCase() + "! " + image.url;

		this.twitter.post('statuses/update', {
			in_reply_to_status_id: respondTo.id_str,
			status: statusText
		}, function(err, reply) {
			if (err) {
				console.log("Error posting tweet:", err);
			}
		});
	}
};


// Become sentient
new SarasPuppies({
	config: './config-env.js',
	screenname: "saraspuppies"
}).skynet();

