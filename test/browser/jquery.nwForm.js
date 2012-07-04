describe('jQuery.nwForm', function () {
    var $form;
    var values = {
        text: 'Text Value',
        checkbox: '1',
        select: '3',
        textarea: 'Textarea Value',
        radio: '3'
    };

    beforeEach(function () {
        //sinon.spy(nw, 'rpc');
    });

    afterEach(function () {
        //nw.rpc.restore();
    });

    beforeEach(function () {
        $('#instances').empty();
        $form = $('#classes').find('form').clone();
        $('#instances').append($form);
    });

    describe("#('data')", function () {
        it('should return form data for all inputs', function () {
            $form.find('[name="text"]').val(values.text);
            $form.find('[name="checkbox"]').attr('checked', true);
            $form.find('[name="select"]').val(values.select);
            $form.find('[name="textarea"]').val(values.textarea);
            $form.find('[name="radio"]').val(values.radio);

            $form.nwForm({url: 'mock'});

            var data = $form.nwForm('data');

            $.each(values, function (name, value) {
                expect(data[name]).to.be(value);
            });
        });

        it('should set form data', function () {
            $form.nwForm({url: 'mock'});

            $form.nwForm('data', values);
            var data = $form.nwForm('data');

            $.each(values, function (name, value) {
                expect(data[name]).to.be(value);
            });
        });
    });

    describe("#('setErrors')", function () {
        it('should add error descriptions to form', function () {
            $form.nwForm({url: 'mock'});

            var errors = {
                text: ['invalid text'],
                textarea: ['invalid content', 'too short'],
                _noField: ['form is invalid', 'fill the form'],
            };

            $form.nwForm('setErrors', errors);

            expect($form.find('.error')).to.not.be.empty();

            var errorTexts = _.flatten(_.values(errors));
            _.each(errorTexts, function (errText) {
                expect($form.find(':contains("'+errText+'")')).to.not.be.empty();
            });
        });
    });

    it('should be able to do POST request on submit', function () {
        $form.nwForm({
            url: 'mock/post',
            method: 'post'
        }).nwForm('data', values);
        $form.submit();

        expect(nw.rpc.calledOnce).to.be.ok();
        var call = nw.rpc.lastCall;
    });

    it('should be able to do GET request on submit', function () {
        $form.nwForm({
            url: 'mock/post',
            method: 'get'
        }).nwForm('data', values);
        $form.submit();

        expect(nw.rpc.calledOnce).to.be.ok();
        var call = nw.rpc.lastCall;
    });

    it('should be able to call custom function on submit', function (done) {
        $form.nwForm({
            method: function (data) {
                expect(this).to.be($form);

                $.each(values, function (name, value) {
                    expect(data[name]).to.be(value);
                });
                done();
            }
        });

        $form.nwForm('data', values);
    });
});
