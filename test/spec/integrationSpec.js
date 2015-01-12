/*globals describe, it, $, chai, before, after, Xrm, _, specUtil*/

'use strict';
describe('CrmFetchKit API', function(){

    // setup chai to use the "expect" style
    var expect = chai.expect,
        whoAmId = null;

    before(function(){

        // get id of the current user
        whoAmId = Xrm.Page.context
          .getUserId().toString().replace(/[{}]/g, '').toLowerCase();
    });

    it('should provided the public member "Fetch"', function(){
        // assert
        expect(CrmFetchKit).to.have.property('Fetch');
    });

    it('should provided the public member "FetchMore"', function(){
        // assert
        expect(CrmFetchKit).to.have.property('FetchMore');
    });

    it('should provided the public member "FetchAll"', function(){
        // assert
        expect(CrmFetchKit).to.have.property('FetchAll');
    });

    it('should provided the public member "Assign"', function(){
        // assert
        expect(CrmFetchKit).to.have.property('Assign');
    });

    describe('Fetch', function() {

        var accountName = 'fetch-unit-test',
            accountId = null,
            accountRecord = {
                Name: accountName,
                AccountCategoryCode: { Value: 1 },
                DoNotFax: true,
                DoNotEMail: false
            },
            fetchxml = ['<fetch version="1.0" output-format="xml-platform"',
                        '   mapping="logical">',
                        '  <entity name="account">',
                        '    <attribute name="name" />',
                        '    <attribute name="accountid" />',
                        '    <attribute name="accountcategorycode" />',
                        '    <attribute name="createdon" />',
                        '    <attribute name="createdby" />',
                        '    <attribute name="donotfax" />',
                        '    <attribute name="donotemail" />',
                        '    <filter type="and">',
                        '      <condition attribute="name"',
                        '          operator="eq" value="' + accountName + '" />',
                        '    </filter>',
                        '  </entity>',
                        '</fetch>'].join('');

        ///
        /// setup
        ///
        before(function(done) {
            this.timeout(8000);

            // create an account record
            CrmRestKit.Create('Account', accountRecord)
                .then(function(data){
                    accountId = data.d.AccountId;
                })
                .fail(specUtil.onRestError)
                .always(done);
        });

        ///
        /// teardown
        ///
        after(function( done ) {
            this.timeout(8000);

            var filter = "(Name eq '" + accountName + "')",
                columns = ['AccountId'];

            // delete the created account
            CrmRestKit
                .ByQuery('Account', columns, filter, false)
                .then(function (data) {

                    $.each(data.d.results, function (index, account) {

                        // perform the delete operaton is sync-mode
                        CrmRestKit.Delete('Account', account.AccountId, false);
                    });
                })
                .fail(specUtil.onRestError)
                .always(done);
        });

        it('should yield a single account record', function( ){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml, false)
                .then(function(results){
                    // assert - only one record is found
                    expect(results.length).to.equal(1);
                })
                .fail(specUtil.onFetchError);
        });

        it('should yield the id of the loaded record', function(done){

            CrmFetchKit.Fetch(fetchxml).then(function(entities){
                var id = entities[0].getValue('accountid');

                expect(id).to.exist();
                expect(id).to.equal(accountId);
            })
            .always(done);
        });

        it('should executed the query in synchronous mode', function(){

            var codeAfterQueryIsReached = false;

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml, false)
                .then(function(){
                    // assert - only one record is found
                    expect(codeAfterQueryIsReached).to.equal(false);
                })
                .fail(specUtil.onFetchError);

            codeAfterQueryIsReached = true;
        });

        it('should yield the "name" of the account', function(done){

            // action - execute the fetchxml query
            CrmFetchKit
                .Fetch(fetchxml)
                .then(function(results){
                    // assert - only one record is found
                    expect(results[0].getValue('name')).to.be.a('string');
                    expect(results[0].getValue('name')).to.be.equal(accountName);

                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should yield the "logicalName" of the entity', function(done){

            // action - execute the fetchxml query
            CrmFetchKit
                .Fetch(fetchxml)
                .then(function(results){
                    // assert - the logical-enity-name is account
                    expect(results[0].logicalName).to.be.equal('account');

                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should yield the "category-code" (optionset) of the account', function(done){

            // action - execute the fetchxml query
            CrmFetchKit
                .Fetch(fetchxml)
                .then(function(results){
                    // assert - the category-code is populated
                    expect(results[0].getValue('accountcategorycode')).to.be.equal(1);
                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should yield the optionset-value as "number"', function(done){
            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(results){
                // assert the category-code is of type "number"
                expect(results[0].getValue('accountcategorycode')).to.be.a('number');
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the for an empty optionset-value "NULL" not "NaN"', function(done){
            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(results){

                // assert - the category-code is of type "number"
                expect(results[0].getValue('industrycode')).to.equal(null);
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the "createdon" attribute', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(results){

                // assert - "createOn" is populated
                expect(results[0].getValue('createdon')).to.not.equal(null);
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the "createdon" as date', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml)
                .then(function(results){

                    // assert - "createOn" of type "Date"
                    expect(results[0].getValue('createdon')).to.a('Date');
                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should yield the id of the lookup-value record', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(entities){

                var account = entities[0];

                // assert - "createBy" is a lookup to the "SystemUser" entity
                expect(account.getValue('createdby')).to.equal(whoAmId);
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the entity-technicalname of the lookup-value record', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(entities){

                var account = entities[0];

                // assert - "createBy" is a lookup to the "SystemUser" entity
                expect(account.getValue('createdby', 'logicalName' )).to.equal('systemuser');
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the primary attr. of the referenced record', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml).then(function(entities){

                var account = entities[0];

                // assert - "createBy" is a lookup to the "SystemUser" entity
                expect(account.getValue('createdby', 'name')).to.exist();
            })
            .fail(specUtil.onFetchError)
            .always(done);
        });

        it('should yield the boolen attributes as boolean', function(done){

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml)
                .then(function(entities){

                    var account = entities[0];

                    // assert - "donotmail"
                    expect(account.getValue('donotemail')).to.be.a('boolean');
                    expect(account.getValue('donotemail')).to.be.equal(false);

                    // assert - "donotfax"
                    expect(account.getValue('donotfax')).to.be.a('boolean');
                    expect(account.getValue('donotfax')).to.be.equal(true);

                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should yield a single account records', function(done){

            // action - execute the fetchxml query
            CrmFetchKit
                .Fetch(fetchxml)
                .then(function(results){
                    // assert - only one record is found
                    expect(results.length).to.equal(1);
                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        it('should executed the query in asynchronous mode', function(done){

            var codeAfterQueryIsReached = false;

            // action - execute the fetchxml query
            CrmFetchKit.Fetch(fetchxml)
                .then(function(){
                    // assert - only one record is found
                    expect(codeAfterQueryIsReached).to.equal(true);
                })
                .fail(specUtil.onFetchError)
                .always(done);

            codeAfterQueryIsReached = true;
        });

        it('should yield the intenral CRM attribute-type', function(done){

            var optionSetAttr = 'preferredcontactmethodcode',
                prefMethodFetchxml = [
                    '<fetch version="1.0" output-format="xml-platform" mapping="logical">',
                    '  <entity name="account">',
                    '    <attribute name="name" />',
                    '    <attribute name="' +optionSetAttr+ '" />',
                    '    <filter type="and">',
                    '      <condition attribute="name"',
                    '       operator="eq" value="' + accountName + '" />',
                    '    </filter>',
                    '  </entity>',
                    '</fetch>'].join( '' );

            CrmFetchKit.Fetch(prefMethodFetchxml)
                .then(function(results){

                    var attr = results[0].getValue(optionSetAttr, 'type');

                    // assert - internal type should be options-setvalue
                    expect(attr).to.be.equal('a:OptionSetValue');
                })
                .fail(specUtil.onFetchError)
                .always(done);
        });

        describe('supports joins /linked-data', function(){

            var fetchxml = [
                '<fetch version="1.0">',
                '  <entity name="account">',
                '    <attribute name="name" />',
                '    <attribute name="accountid" />',
                '    <attribute name="createdon" />',
                '    <attribute name="createdby" />',
                '    <filter type="and">',
                '      <condition attribute="name" operator="eq" value="' + accountName + '" />',
                '    </filter>',
                '    <link-entity name="businessunit" from="businessunitid"',
                '           to="owningbusinessunit" link-type="inner" alias="bu">',
                '       <attribute name="name" />',
                '       <filter>',
                '           <condition attribute="parentbusinessunitid" operator="null" />',
                '       </filter>',
                '   </link-entity>',
                '  </entity>',
                '</fetch>'].join( '' );

            it('should provided the joined data via the defined "alias"', function(done){

                // action - executed fetchxml that uses an join
                CrmFetchKit.Fetch(fetchxml)
                    .then(function(results){

                        // assert - the query uses "bu" as alias
                        expect(results[0].getValue('bu.name')).to.exist();
                    })
                    .fail(specUtil.onFetchError)
                    .always(done);
            });
        });

        describe('support for attributes for type enity-collection', function(){

            var numberOfAttendees = 2,
                requiredAttendees = [],
                appointmentId = null;

            // setup
            before(function(done){
                // increase the timeout limit for mocha
                this.timeout(8000);

                // create the needed test-data
                specUtil.createContactAsAttendees(numberOfAttendees)
                    .then(function(listOfAttendees){
                        // store the generated attendees
                        requiredAttendees = listOfAttendees;

                        return requiredAttendees;
                    })
                    .then(specUtil.createAppointmentWithAttendees)
                    .then(function(appointmentid){
                        // keep the id of the created appointment
                        appointmentId = appointmentid;
                    })
                    .always(done);
            });

            // teardown
            after(function(){
                this.timeout(40000);

                // delete the test contact records
                _.each(requiredAttendees, function(activityParty){

                    CrmRestKit.Delete('Contact', activityParty.PartyId.Id);
                });

                // delete the test-appointment
                CrmRestKit.Delete('Appointment', appointmentId);
            });

            it('should fetch the required-attendes (type of EntityCollection /PartyList)', function(done){

                var fetchxml = [
                    '<fetch version="1.0">',
                    '  <entity name="appointment">',
                    '    <attribute name="subject" />',
                    '    <attribute name="requiredattendees" />',
                    '    <filter type="and">',
                    '      <condition attribute="activityid" operator="eq" value="' + appointmentId + '" />',
                    '    </filter>',
                    '  </entity>',
                    '</fetch>'].join('');

                CrmFetchKit.Fetch(fetchxml)
                    .then(function(results){

                        var attendees = results[0].getValue('requiredattendees');

                        // assert - the list of attendees is retrieved
                        expect(attendees.entities.length).to.equal(numberOfAttendees);
                        // assert - the EntityCollection attr. is parsed
                        expect(attendees.entities[0].getValue('partyid')).to.exist();
                    })
                    .always(done);
            });
        });
    });

    describe('FetchMore', function(){

        var numberOfContacts = 15,
            lastName = 'foobar-fetchmore',
            countLimit = 10,
            fetchxml = [
                '<fetch version="1.0" output-format="xml-platform" ',
                        'mapping="logical" ',
                        'returntotalrecordcount="true" ',
                        'count="' + countLimit + '">',
                '  <entity name="contact">',
                '    <attribute name="lastname" />',
                '    <attribute name="contactid" />',
                '    <filter type="and">',
                '      <condition attribute="lastname" ',
                '           operator="like" value="' + lastName + '%" />',
                '    </filter>',
                '  </entity>',
                '</fetch>'].join('');

        // setup
        before(function(done){

            // increase the execution-time-limit for mocha.js
            this.timeout(15000);

            // create some contact records for the tests
            specUtil
                .createSetOfContacts(numberOfContacts, lastName)
                .always(function(/*notRelevantParameter*/){
                    done();
                });
        });

        // teardown
        after(function(done){

            // increase the execution-time-limit for mocha.js
            this.timeout(15000);

            specUtil
                .deleteContactsByFilter("LastName eq '"+ lastName +"'")
                .always(function(/*notRelevantParameter*/){
                    done();
                });
        });

        it('should support the asynchronous execution', function(done){

            var codeAfterQueryIsReached = false;

            // action - execute the query in async. mode (default)
            CrmFetchKit.FetchMore(fetchxml)
                .then(function(){

                    // assert
                    expect(codeAfterQueryIsReached).to.be.equal(true);
                })
                .always(done);

            codeAfterQueryIsReached = true;
        });

        it('should support the synchronous execution', function(){

            var codeAfterQueryIsReached = false;

            // action - execute the query in sync. mode
            CrmFetchKit.FetchMore(fetchxml, false).then(function(){

                // assert
                expect(codeAfterQueryIsReached).to.be.equal(false);
            });

            codeAfterQueryIsReached = true;
        });

        it('should provided the "totalRecordcount" information', function(done){

            // action - execute the query. Due to the count-limit
            // the query should only yield the first 10 records
            CrmFetchKit.FetchMore(fetchxml).then(function(response){

                // assert
                expect(response).to.have.property('totalRecordCount');
                expect(response.totalRecordCount).to.be.a('number');
                expect(response.totalRecordCount).to.be.equal(numberOfContacts);
            })
            .always(done);
        });

        it('should provided the "moreRecords" information', function(done){

            // action - execute the query
            CrmFetchKit.FetchMore(fetchxml).then(function(response){

                // assert - moreRecords is true
                expect(response).to.have.property('moreRecords');
                expect(response.moreRecords).to.be.a('boolean');
                expect(response.moreRecords).to.be.equal(true);
            })
            .always(done);
        });

        it('should provided the "entityName" information', function(done){

            // action - execute the query
            CrmFetchKit.FetchMore(fetchxml).then(function(response){

                // assert - moreRecords is true
                expect(response).to.have.property('entityName');
                expect(response.entityName).to.be.a('string');
                expect(response.entityName).to.be.equal('contact');
            })
            .always(done);
        });

        it('should provided the loaded records in the "entities" property', function(done){

            // action - execute the query
            CrmFetchKit.FetchMore(fetchxml).then(function(response){

                // assert - moreRecords is true
                expect(response).to.have.property('entities');
                expect(response.entities).to.be.a('array');
                expect(response.entities.length).to.be.equal(countLimit);
            })
            .always(done);
        });

        it('should provided the "pagingCookie" information', function(done){

            // action - execute the query
            CrmFetchKit.FetchMore(fetchxml).then(function(response){

                // assert - moreRecords is true
                expect(response).to.have.property('pagingCookie');
                expect(response.pagingCookie).to.be.a('string');
            })
            .always(done);
        });
    });

    describe('FetchAll', function(){

        var numnberOfContacts = 10,
            lastName = 'foobar - fetchall',
            queryCountLimit = 5,
            fetchxml = [
                '<fetch version="1.0" count="' + queryCountLimit + '">',
                '  <entity name="contact">',
                '    <attribute name="lastname" />',
                '    <attribute name="contactid" />',
                '    <filter type="and">',
                '      <condition attribute="lastname"',
                '       operator="like" value="' + lastName + '" />',
                '    </filter>',
                '  </entity>',
                '</fetch>'].join('');

        // setup
        before(function(done){

            // increase the execution-time-limit for mocha.js
            this.timeout(9000);

            // create some contact records for the tests
            specUtil
                .createSetOfContacts(numnberOfContacts, lastName)
                .always(function(/*notRelevantParameter*/){
                    done();
                });
        });

        // teardown
        after(function(done){
            // increase the execution-time-limit for mocha.js
            this.timeout(9000);

            specUtil
                .deleteContactsByFilter("LastName eq '"+ lastName +"'")
                .always(function(/*notRelevantParameter*/){
                    done();
                });
        });

        it('should execute the query in async mode', function(done){
            // arrange
            var codeAfterQueryIsReached = false;
            // action
            CrmFetchKit.Fetch(fetchxml)
                .then(function(){

                    // assert
                    expect(codeAfterQueryIsReached).to.equal(true);
                })
                .always(done);

            codeAfterQueryIsReached = true;
        });

        it('should load all contact records', function(done){

            // action - execute the query
            CrmFetchKit.FetchAll(fetchxml)
                .then(function(entities){
                    // assert
                    expect(entities.length).to.equal(numnberOfContacts);
                })
                .always(done);
        });
    });

    describe('Assign', function(){

        // Note: This integration-test depends on an existing user and an team
        var contactid = null,
            contactlastname = 'foobar',
            userlastname = 'kayir',
            userid = null,
            teamname = 'Integration-Test-Team',
            teamid = null;

        // setup
        before(function(done){
            // increase timeout limit of mocha
            this.timeout(8000);

            var contactPromise, teamPromise, userPromise,
                userfilter = "LastName eq '"+userlastname+"'",
                teamfilter = "Name eq '" +teamname+ "'";

            // arrange - create an contact record
            contactPromise = specUtil.createContactRecord(contactlastname);

            // arrange - get the team record
            teamPromise = CrmRestKit
                .ByQuery('Team', ['TeamId'], teamfilter)
                .then(function(data /*notNeededPrameter*/){
                    // only the entities records are relevant
                    return data.d.results;
                });

            // arrange - get the required
            userPromise = CrmRestKit
                .ByQuery('SystemUser', ['SystemUserId'], userfilter)
                .then(function(data /*notNeededPrameter*/){
                    // only the entities records are relevant
                    return data.d.results;
                });

             // defere the tests until the data is loaded /created
             $.when(contactPromise, teamPromise, userPromise)
                .then(function(contactData, teamEntities, userEntities){
                    contactid = contactData.d.ContactId;
                    teamid = teamEntities[0].TeamId;
                    userid = userEntities[0].SystemUserId;
                })
                .always(done);
        });

        // teardown
        after(function(done){
            // increase timeout limit of mocha
            this.timeout(4000);

            specUtil
                .deleteContactsByFilter("LastName eq '"+ contactlastname +"'")
                .always(done);
        });

        it('should change the owner of the record to a team', function(done){

            CrmFetchKit.Assign(contactid, 'contact', teamid, 'team')
                .then(function(){

                    // get the contact record
                    CrmRestKit.Retrieve('Contact', contactid, ['Owner'])
                        .then(function(contact){
                            expect(contact.Owner.Id).to.equal(teamid);
                        });
                })
                .always(done);
        });

        it('should change the owner of the record to a another user', function(done){

            CrmFetchKit.Assign(contactid, 'contact', teamid, 'team')
                .then(function(){

                    // get the contact record
                    CrmRestKit.Retrieve('Contact', contactid, ['Owner'])
                        .then(function(contact){
                            expect(contact.Owner.Id).to.equal(userid);
                        });
                })
                .always(done);
        });



    });
});
