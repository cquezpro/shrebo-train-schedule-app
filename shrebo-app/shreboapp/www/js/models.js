/**
 * models loader
 */
define([ // list of models
// data resources
'models/shareable', // Shareable
'models/freebusy', // FreeBusy
'models/reservation', // Reservation
'models/user', // User
'models/group', // Group
// action resources
// 'models/signup', // Signup (deprec)
// 'models/auth', // Auth (deprec)
'models/auth/signup', // Signup
'models/auth/session', // Session (previously Auth, API compatible)
'models/trainconnection', // connection
'models/scancode', // scancode
'models/itry/itinerary', // Itinerary
'models/itry/itinerary_reservation', // ItineraryReservation
'models/itry/itinerary_passenger', // ItineraryPassenger
'models/itry/itinerary_service', // ItineraryService
'models/itry/itinerary_price', // ItineraryPrice
'models/itry/itinerary_stop', // ItineraryStop
'models/itry/service_section', // ServiceSection
'models/shop/order', // shop Order
'models/shop/payment', // shop Payment
'models/auth/profile', // auth v2 -- user profile
'models/auth/address', // auth v2 -- user address
'models/itry/geocode', // itry GeoCode
'models/polls/polls', // itry GeoCode
'models/notify/notify', // Notification
], function(Shareable, FreeBusy, Reservation, User, //
Group, Signup, Auth, Connection, Scancode, //
Itinerary, ItineraryReservation, ItineraryPassenger, //
ItineraryService, ItineraryPrice, ItineraryStop, ServiceSection, //
Order, Payment, UserProfile, UserAddress, GeoCode, Polls, //
AppNotification) {
    var models = {
        'Shareable' : Shareable,
        'FreeBusy' : FreeBusy,
        'Reservation' : Reservation,
        'User' : User,
        'Group' : Group,
        'Signup' : Signup,
        'Auth' : Auth,
        'Connection' : Connection,
        'Scancode' : Scancode,
        'Itinerary' : Itinerary,
        'ItineraryReservation' : ItineraryReservation,
        'ItineraryPassenger' : ItineraryPassenger,
        'ItineraryService' : ItineraryService,
        'ItineraryPrice' : ItineraryPrice,
        'ItineraryStop' : ItineraryStop,
        'ServiceSection' : ServiceSection,
        'Order' : Order,
        'Payment' : Payment,
        'UserProfile' : UserProfile,
        'UserAddress' : UserAddress,
        'GeoCode' : GeoCode,
        'Polls' : Polls,
        'AppNotification' : AppNotification,
    };
    return models;
});
