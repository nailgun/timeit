describe('nw.forms', function () {
    describe('#handle()', function () {
        it('should fail if form validator fails', function (done) {
            var form = nw.forms.create({}, function (bound, callback) {
                callback('form error');
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('_noField');
                done();
            });
        });

        it('should success if form validator have successe', function (done) {
            var form = nw.forms.create({}, function (bound, callback) {
                callback();
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.be.ok();
                done();
            });
        });

        it('should pass bound form to validator and callback', function (done) {
            var value = 'value';

            var form = nw.forms.create({
                field1: nw.forms.StringField()
            }, function (bound, callback) {
                expect(bound.data.field1).to.be(value);
                callback();
            });

            form.handle({
                field1: value
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.be(value);
                done();
            });
        });

        it('should call parse method of each of its fields', function (done) {
            var valueIn = 'value1';
            var valueOut = 'value2';

            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    expect(raw_data).to.be(valueIn);
                    callback(null, valueOut);
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField()
            });

            form.handle({
                field1: valueIn
            }, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(bound.data.field1).to.be(valueOut);
                done();
            });
        });

        it('should fail if field parser fails', function (done) {
            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    callback({
                        code: 'invalid',
                        message: field.errorMessages['invalid']
                    });
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField()
            });

            form.handle({
                field1: 'value'
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                done();
            });
        });

        it('should fail if field is required and data is missing', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField(),
                field2: nw.forms.StringField()
            });

            form.handle({
                field2: 'value'
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                done();
            });
        });

        it('should not fail if field is not required and data is missing', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false
                })
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.be.ok();
                done();
            });
        });

        it('should fail if field validator fails', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [function (value, callback) {
                        callback({
                            code: 'invalid',
                            message: 'field is invalid'
                        });
                    }]
                })
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                done();
            });
        });

        it('should success if field validator have success', function (done) {
            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [function (value, callback) {
                        callback();
                    }]
                })
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.be.ok();
                done();
            });
        });

        it('should call all field validators', function (done) {
            function validator (value, callback) {
                callback();
            }
            var validator1 = sinon.spy(validator),
                validator2 = sinon.spy(validator),
                validator3 = sinon.spy(validator),
                validator4 = sinon.spy(validator);

            var form = nw.forms.create({
                field1: nw.forms.StringField({
                    required: false,
                    validators: [validator1, validator2]
                }),
                field2: nw.forms.StringField({
                    required: false,
                    validators: [validator3, validator4]
                })
            });

            form.handle({}, function (bound) {
                expect(bound.isValid()).to.be.ok();
                expect(validator1.calledOnce).to.be.ok();
                expect(validator2.calledOnce).to.be.ok();
                expect(validator3.calledOnce).to.be.ok();
                expect(validator4.calledOnce).to.be.ok();
                done();
            });
        });

        it('should check all fields for errors', function (done) {
            var MockField = function (opt) {
                var field = nw.forms.BaseField(opt);
                field.parse = function (raw_data, callback) {
                    callback({
                        code: 'invalid',
                        message: field.errorMessages['invalid']
                    });
                };
                return field;
            };

            var form = nw.forms.create({
                field1: MockField(),
                field2: MockField()
            });

            form.handle({
                field1: 'value1',
                field2: 'value2'
            }, function (bound) {
                expect(bound.isValid()).to.not.be.ok();
                expect(bound.errors).to.have.property('field1');
                expect(bound.errors).to.have.property('field2');
                done();
            });
        });

        // TODO: error messages
    });
});
