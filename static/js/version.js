$(function () {
    timeit.get('version').ok(function(version) {
        $('#version').text(version);
    });
});
