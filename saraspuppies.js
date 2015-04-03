/*

TODO:
* Just preload a bunch of images instead of making an image request each time
* Error handling

*/

// Load some requires
var Twit = require('twit');							// Twitter Client
var GoogleImages = require("google-images");		// Google Image Search
var FS = require('fs');								// File System Client
var _ = require("underscore");						// Underscore JS


// Define our bot class
function SarasPuppies(options) {
	// Init twitter client
	this.twitter = new Twit(require(options.config));
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
		// Verify our credentials
		var self = this;
		this.twitter.get("account/verify_credentials", {}, function(err, data, response) {
			if (err) {
				console.log("Error: Unable to verify credentials", err);
			}
			else {
				self.screenname = data.screen_name;
				console.log("Successfully authenticated as " + self.screenname);
				self.startListening();
			}
		});
	},

	/**
	 * Listen on the streaming API
	 */
	startListening: function() {
		// Timeline stream
		var self = this;
		var stream = this.twitter.stream("user", { with: "followings" });
		console.log("Starting user stream");

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
					var image = images[index];

					// Write image to a path
					console.log("Downloading image from URL " + image.url);
					var img_path = "/tmp/image." + (new Date()).getTime();
					image.writeTo(img_path, function() {
						console.log("Wrote image to " + img_path);
						self.tweetImage(img_path, searchTerm, respondTo);
					});
				} else {
					console.log("No images found");
				}
			}
		});
	},

	/**
	 * Tweet a pug image
	 */
	tweetImage: function(imagePath, searchTerm, respondTo) {
		var self = this;

		// Build status text
		console.log("Replying to tweet " + respondTo.id + " from user " + respondTo.user.screen_name);

		// Screen names to tweet at
		var screennames = [respondTo.user.screen_name];
		if (respondTo.entities && respondTo.entities.user_mentions) {
			screennames = _.without(_.union(screennames, _.map(respondTo.entities.user_mentions, function(mention) { return mention.screen_name; })), this.screenname);
		}
		console.log("Including screennames " + screennames.join(", ") + " in tweet");

		var statusText = "@" + screennames.join(" @");
		statusText += " " + searchTerm.toUpperCase() + "!";

		console.log("Tweet text: " + statusText);

		// Upload content
		console.log("Uploading image");
		var b64content = FS.readFileSync(imagePath, { encoding: 'base64' });
		self.twitter.post('media/upload', {
			media: b64content
		}, function (err, data, response) {
			if (err) {
				console.log("Error uploading media:", err);
			}
			else {
				var mediaIdStr = data.media_id_string;
				self.twitter.post('statuses/update', {
					in_reply_to_status_id: respondTo.id_str,
					status: statusText,
					media_ids: [mediaIdStr]
				}, function(err, data) {
					if (err) {
						console.log("Error posting tweet:", err);
					}
					else {
						console.log("Tweet posted with ID " + data.id_str);
						FS.unlink(imagePath, function(err) {
							if (err) {
								console.log("Error cleaning up image file " + imagePath);
							}
							else {
								console.log("Deleted image file " + imagePath);
							}
						});
					}
				});
			}
		});

	}
};


// Become sentient
new SarasPuppies({
	config: './config-env.js'
}).skynet();

