define([// setup all views
"views/shareable_list", // shareable list
'views/reservation', // generic reservation view,
'views/booking_list', // booking list
'views/booking_booker', // booking view for bookers,
'views/search', // search view
'views/searchresults', // search view
'views/qrcode', // qrcode scan
'views/group_list', // group list view
'views/signup', // signup view
'views/login', // login view
'views/feedback', // feedback view
'views/staff_vote', // staff vote
'views/customer_vote', // staff vote
'views/password_dialog', // password dialog (modal)
'views/staff_service', // staff service selection
'views/stats', // stats view
'views/confirm_dialog', // confirm dialog
'views/itinerary_detail', // confirm dialog
'views/seats', // seat selection
'views/polls/polls', // poll helper 
'views/favorites', // favorite dialog
], function(shareable_list, reservation, booking_list, booking_booker, //
search, search_results, qrcode, group_list, signup, login, feedback, //
staff_vote, customer_vote, password_dialog, staff_service, stats, // 
confirm_dialog, itinerary_detail, seats, polls, favorites_dialog) { 
    var views = {
        ShareableListView : shareable_list,
        ReservationView : reservation,
        BookingListView : booking_list,
        BookingBookerView : booking_booker,
        SearchView : search,
        SearchResultsView : search_results,
        ScanQRCodeView : qrcode,
        GroupListView : group_list,
        SignupView : signup,
        LoginView : login,
        FeedbackView : feedback,
        StaffVoteView : staff_vote,
        CustomerVoteView : customer_vote,
        PasswordDialog : password_dialog,
        StaffServiceView : staff_service,
        StatsView : stats,
        ConfirmDialog : confirm_dialog,
        ItineraryDetailView : itinerary_detail,
        SeatSelectionView: seats,
        Polls : polls,
        FavoritesDialog : favorites_dialog,
    };
    return views;
});