define([ // add all templates to be loaded
"text!templates/shareable_list.html", // HomeView
"text!templates/reservation.html", // ReservationView
"text!templates/reservation_appointment.html", // ReservationAppointmentView
"text!templates/time_select.html", // Time selection control in mobiscroll
                                    // calender
"text!templates/booking_list.html", // Booking List view
"text!templates/booking_booker.html", // Booking View for booker
"text!templates/group_list.html", // Group list
"text!templates/signup.html", // signup form
"text!templates/login.html", // login form
"text!templates/search.html", // search form
"text!templates/search_results.html", // search form
"text!templates/staff_vote.html", // staff vote dialog
"text!templates/customer_vote.html", // staff vote dialog
"text!templates/vote_inline.html", // staff vote dialog
"text!templates/top_menu.html", // default top menu
"text!templates/top_menu_okcancel.html", // ok cancel top menu
"text!templates/top_menu_staffvote.html", // staff vote top menu
"text!templates/password_dialog.html", // password dialog
"text!templates/confirm_dialog.html", // confirm dialog
"text!templates/staff_service.html", // staff vote dialog
"text!templates/feedback.html", // feedback dialog
"text!templates/stats.html", // stats
"text!templates/itinerary_detail.html", // itinerary detail
"text!templates/seats.html", // seat selection
"text!templates/favorites_dialog.html", // favorites
], function(shareable_list, reservation, reservation_appointment, time_select, //
booking_list, booking_booker, group_list, signup, login, search, search_results, //
staff_vote, customer_vote, staff_vote_inline, //
top_menu, top_menu_okcancel, top_menu_staffvote, 
password_dialog, confirm_dialog, //
staff_service, feedback, stats, itinerary_detail, seats, favorites_dialog) {
    return {
        // 
        shareable_list_html : shareable_list,
        reservation_html : reservation,
        reservation_appointment_html : reservation_appointment,
        time_select_html : time_select,
        //
        booking_list_html : booking_list,
        booking_booker_html : booking_booker,
        group_list_html : group_list,
        signup_html : signup,
        login_html : login,
        search_html : search,
        search_results_html : search_results,
        //
        staff_vote_html : staff_vote,
        customer_vote_html : customer_vote,
        staff_vote_inline_html : staff_vote_inline,
        //
        top_menu_html : top_menu,
        top_menu_okcancel_html : top_menu_okcancel,
        top_menu_staffvote_html : top_menu_staffvote,
        //
        password_dialog_html : password_dialog,
        confirm_dialog_html : confirm_dialog,
        //
        staff_service_html : staff_service,
        feedback_html : feedback,
        stats_html : stats,
        itinerary_detail_html : itinerary_detail,
        seats_html : seats,
        favorites_dialog_html : favorites_dialog,
    };
});
