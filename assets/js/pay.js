"use strict";
$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});
var api = (path = '') => window.location.protocol + "//" + window.location.host + "/api/v2" + path;
$('#submitBtn').click(function (e) {
    e.preventDefault()
    $('#realSubmitButton').click()
})

$('#paymentForm').submit(function (e) {
    e.preventDefault()
    // @ts-ignore
    var $paymentForm = $('#paymentForm')
    var email = $paymentForm.find('input[name=email]').val()
    var amount = $paymentForm.find('input[name=amount]').val()
    var transactionReference = "" + Math.floor((Math.random() * 1000000000) + 1);
    var user;
    var handleExternalPaymentInitiationResponse = function (response) {
        if (!response.status) {
            return Promise.reject(response.message)
        }
        user = response.data.user;
        return payWithPaystack({
            email: email,
            amount: amount,
            reference: transactionReference,
            first_name: user.first_name,
            metadata: {
                site_details: {
                    "first_name": user.first_name,
                    "user_id": user.id
                }
            }
        });
    };
    var updateOnlineDatabase=function(response){
        return $.post(api('/wallet/verify'), JSON.stringify({
            "userid": user.id,
            "reference": transactionReference,
        }));
    }
    var handlePaystackResponse=function(response){
        //Retry whenever this transaction fails
        updateOnlineDatabase().catch(handlePaystackResponse)
    }
    //$.get(api("/users/email/"+email))
    $.post(api('/wallet/payment/external/email'), JSON.stringify({
            "amount": amount,
            "reference": transactionReference,
            "email": email
        }))
        .then(handleExternalPaymentInitiationResponse)
        .then(handlePaystackResponse)
        .catch(function (error) {
            if (typeof error=="string")
                alertify.error(error)
            else
                alertify.error("Unknown error occured while processing request!")
        })
    // $.post(api('/wallet/payment/external/email'),{
    //     amount:"333"
    // }).then(function(res){
    //     console.log(res)
    //     /* 
    //         payWithPaystack({
    //     email:email,
    //     amount:amount,
    //     reference:
    // // })
    //     */

    // },function(err){
    //     console.error(err)
    // })


})


function payWithPaystack(data) {

    return new Promise((resolve, reject) => {
        // @ts-ignore
        var handler = PaystackPop.setup({
            key: 'pk_test_1544ffee69407a91be7cece08566ea4ca1343126',
            email: data.email,
            amount: data.amount * 100, //kb //100*100
            ref: data.reference,
            first_name: data.first_name,
            /* firstname: data.fname,
            lastname: data.lname, */
            // label: "Optional string that replaces customer email"
            metadata:data.metadata,
            callback: function (response) {
                console.log('response', response)
                resolve(response)

                ///alert('success. transaction ref is ' + response.reference);
            },
            onClose: function () {
                reject(false)

            }
        });
        handler.openIframe();
        
    })

}
// @ts-ignore-end