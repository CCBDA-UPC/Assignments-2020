(function ($) {
    apiUrl = 'https://YOUR-API-HOST/test/serverless-controller';
    tableName = 'shopping-list';

    // Load Table items when page loads
    // Call API Gateway GET Item
    $.ajax({
        url: apiUrl + "?" + $.param({TableName: tableName}),
        type: 'GET',
        crossDomain: true,
        success: function (result) {
            $.each(result.Items, function (i, item) {
                $('#items').append('<li>' + item.ThingId.S + '</li>');
            });
        },
        error: function (result) {
            $('#error').toggle().append('<div>' + result.statusText + '</div>');
        }
    });

    // Form submit
    $("#form").submit(function (event) {
        event.preventDefault();
        ThingId = $('#ThingId').val();

        // Call API Gateway POST Item
        $.ajax({
            url: apiUrl,
            data: JSON.stringify({TableName: tableName, Item: {ThingId: {S: ThingId}}}),
            type: 'POST',
            crossDomain: true,
            success: function (result) {
                $('#ThingId').val('');
                $('#items').append('<li>' + ThingId + '</li>');
            },
            error: function (result) {
                $('#error').toggle().append('<div>' + result.statusText + '</div>');
            }
        });
    });

})(jQuery);