# source: https://github.com/nomad/houston
# check on how to create .pem
require 'houston'
require 'securerandom'

# Environment variables are automatically read, or can be overridden by any specified options. You can also
# conveniently use `Houston::Client.development` or `Houston::Client.production`.
APN = Houston::Client.development
APN.certificate = File.read(File.expand_path("~/.shrebo/ch.cleverpendeln.customer.pem"))

# An example of the token sent back when a device registers for notifications
token = "5a9903e061db3da141c04ab268d0e9a8a1f7713a3bb5aeb3030fcb8c9cbaee2e"

# Create a notification that alerts a message to the user, plays a sound, and sets the badge on the app
notification = Houston::Notification.new(device: token)
notification.alert = "Hello, World #{SecureRandom.uuid}!"

# Notifications can also change the badge count, have a custom sound, have a category identifier, indicate available Newsstand content, or pass along arbitrary data.
notification.badge = 57
notification.sound = "sosumi.aiff"
notification.category = "INVITE_CATEGORY"
notification.content_available = true
notification.custom_data = { "data" => '{ "href" :  "#customervote", "reference" : "00017JLS" }' }

# And... sent! That's all it takes.
APN.push(notification)
print "Ok, sent #{notification.alert} to #{token}\n"
