describe('jQuery.nwForm', function () {
    var $form;
    var values = {
        text: 'Text Value',
        checkbox: 'on',
        select: '3',
        textarea: 'Textarea Value',
        radio: '3'
    };

    beforeEach(function () {
        testUtils.mockAjax();
        sinon.spy(nw, 'rpc');
    });

    afterEach(function () {
        nw.rpc.restore();
        $.ajax.restore();
    });

    beforeEach(function () {
        $('#instances').empty();
        $form = $('#classes').find('form').clone();
        $('#instances').append($form);
    });

    describe("#('data')", function () {
        it('should get form data from all inputs', function () {
            $form.find('[name="text"]').val(values.text);
            $form.find('[name="checkbox"]').attr('checked', true);
            $form.find('[name="select"]').val(values.select);
            $form.find('[name="textarea"]').val(values.textarea);
            $form.find('[name="radio"]').filter('[value="'+values.radio+'"]').attr('checked', true);

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
            var formText = $form.text().toLowerCase();
            _.each(errorTexts, function (errText) {
                expect(formText).to.contain(errText);
            });
        });
    });

    describe("#('submit')", function () {
        it('should be able to do POST request on submit', function (done) {
            $form.nwForm({
                url: 'mock',
                method: 'post'
            }).nwForm('data', values);

            $form.on('submitSuccess', function (data) {
                expect(nw.rpc.calledOnce).to.be.ok();
                var call = nw.rpc.lastCall;
                expect(call.args[0]).to.be('mock');
                expect(call.args[1].type).to.be('post');
                done();
            });

            $form.submit();
        });

        it('should be able to do GET request on submit', function (done) {
            $form.nwForm({
                url: 'mock',
                method: 'get'
            }).nwForm('data', values);

            $form.on('submitSuccess', function (data) {
                expect(nw.rpc.calledOnce).to.be.ok();
                var call = nw.rpc.lastCall;
                expect(call.args[0]).to.be('mock');
                expect(call.args[1].type).to.be('get');
                done();
            });

            $form.submit();
        });

        it('should call underlying validators', function (done) {
            function validator (value, callback) {
                callback();
            }
            var validator1 = sinon.spy(validator),
                validator2 = sinon.spy(validator);

            $form.nwForm({
                url: 'mock',
                fields: {
                    text: nw.forms.StringField({
                        required: false,
                        validators: [validator1]
                    })
                },
                validate: validator2
            }).nwForm('data', values);

            $form.on('submitSuccess', function () {
                expect(validator1.calledOnce).to.be.ok();
                expect(validator2.calledOnce).to.be.ok();
                done();
            });

            $form.submit();
        });

        it('should be able to call custom function on submit', function (done) {
            var values = {
                text: 'Text Value',
                checkbox: true,
                select: 3,
                textarea: 'Textarea Value',
                radio: 3
            };
            $form.nwForm({
                fields: {
                    text: nw.forms.StringField(),
                    checkbox: nw.forms.BooleanField(),
                    select: nw.forms.NumberField(),
                    textarea: nw.forms.StringField(),
                    radio: nw.forms.NumberField()
                },
                method: function (data) {
                    expect(this[0] === $form[0]).to.be.ok();
                    $.each(values, function (name, value) {
                        expect(data[name]).to.be(value);
                    });
                    done();
                    return $.Deferred();
                }
            }).nwForm('data', values);
            $form.submit();
        });

        it('should trigger error event when validation fails', function (done) {
            $form.nwForm({
                url: 'mock',
                validate: function (bound, callback) {
                    callback('form error');
                }
            });

            var successSpy = sinon.spy();
            $form.on('submitSuccess', successSpy);
            $form.on('submitError', function (e, errors) {
                expect(errors).to.have.property('_noField');
                setTimeout(function () {
                    expect(successSpy.called).to.not.be.ok();
                    done();
                }, 100);
            });
            $form.submit();
        });

        it('should trigger error event when submit fails', function (done) {
            $.ajax.mockResolve = function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: {
                        _noField: ['error']
                    }
                });
            };
            $form.nwForm({
                url: 'mock'
            });

            var successSpy = sinon.spy();
            $form.on('submitSuccess', successSpy);
            $form.on('submitError', function (e, errors) {
                expect(errors).to.have.property('_noField');
                setTimeout(function () {
                    expect(successSpy.called).to.not.be.ok();
                    done();
                }, 100);
            });
            $form.submit();
        });

        it('should trigger error event when custom method fails', function (done) {
            $form.nwForm({
                url: 'mock',
                method: function (data) {
                    var deferred = $.Deferred();
                    setTimeout(function () {
                        deferred.reject({
                            _custom: ['error']
                        });
                    });
                    return deferred;
                }
            });

            var successSpy = sinon.spy();
            $form.on('submitSuccess', successSpy);
            $form.on('submitError', function (e, errors) {
                expect(errors).to.have.property('_custom');
                setTimeout(function () {
                    expect(successSpy.called).to.not.be.ok();
                    done();
                }, 100);
            });
            $form.submit();
        });

        it('should show errors when validation fails', function (done) {
            $form.nwForm({
                url: 'mock',
                validate: function (bound, callback) {
                    callback('myerror');
                }
            });

            $form.on('submitError', function () {
                expect($form.text().toLowerCase()).to.contain('myerror');
                done();
            });
            $form.submit();
        });

        it('should show errors when submit fails', function (done) {
            $.ajax.mockResolve = function (deferred) {
                deferred.resolve({
                    status: 'err',
                    body: {
                        _noField: ['myerror']
                    }
                });
            };
            $form.nwForm({
                url: 'mock'
            });

            $form.on('submitError', function () {
                expect($form.text().toLowerCase()).to.contain('myerror');
                done();
            });
            $form.submit();
        });

        it('should show errors when custom method fails', function (done) {
            $form.nwForm({
                url: 'mock',
                method: function (data) {
                    var deferred = $.Deferred();
                    setTimeout(function () {
                        deferred.reject({
                            text: ['myerror']
                        });
                    });
                    return deferred;
                }
            });

            $form.on('submitError', function () {
                expect($form.text().toLowerCase()).to.contain('myerror');
                done();
            });
            $form.submit();
        });

        it('should trigger submitted event when submit successes', function (done) {
            $form.nwForm({
                url: 'mock',
                fields: {
                    text: nw.forms.StringField()
                }
            }).nwForm('data', {
                text: 'value'
            });

            var errorSpy = sinon.spy();
            $form.on('submitError', errorSpy);
            $form.on('submitSuccess', function (e, data) {
                expect(data.text).to.be('value');
                setTimeout(function () {
                    expect(errorSpy.called).to.not.be.ok();
                    done();
                }, 100);
            });

            $form.submit();
        });

        it('should trigger submitted event when custom method successes', function (done) {
            $form.nwForm({
                fields: {
                    text: nw.forms.StringField()
                },
                method: function (data) {
                    var deferred = $.Deferred();
                    setTimeout(function () {
                        deferred.resolve();
                    });
                    return deferred;
                }
            }).nwForm('data', {
                text: 'value'
            });

            var errorSpy = sinon.spy();
            $form.on('submitError', errorSpy);
            $form.on('submitSuccess', function (e, data) {
                expect(data.text).to.be('value');
                setTimeout(function () {
                    expect(errorSpy.called).to.not.be.ok();
                    done();
                }, 100);
            });

            $form.submit();
        });
    });
});
