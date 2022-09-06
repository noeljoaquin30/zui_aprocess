sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../control/DynamicTable"

],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("zuiaprocess.controller.Main", {
            onInit: function () {
                this.getColumns();
            },

            getColumns() {
                var me = this;

                //get dynamic columns based on saved layout or ZERP_CHECK
                var oJSONColumnsModel = new JSONModel();
                // this.oJSONModel = new JSONModel();

                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                console.log(oModel)
                oModel.setHeaders({
                    sbu: 'VER',
                    type: 'APROCESS',
                    tabname: 'ZDV_3DERP_ANP'
                });

                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        console.log(oData);
                        oJSONColumnsModel.setData(oData);
                        // me.oJSONModel.setData(oData);
                        me.getView().setModel(oJSONColumnsModel, "Columns"); //set the view model
                        me.getTableData(oData.results);
                    },
                    error: function (err) { }
                });
            },

            getTableData: function (columns) {
                var me = this;
                var oModel = this.getOwnerComponent().getModel();

                //get styles data for the table
                var oJSONDataModel = new JSONModel();
                // var aFilters = this.getView().byId("SmartFilterBar").getFilters();
                // var oText = this.getView().byId("StylesCount"); //for the count of selected styles
                // this.addDateFilters(aFilters); //date not automatically added to filters

                oModel.read("/MainSet", {
                    // filters: aFilters,
                    success: function (oData, oResponse) {
                        // oText.setText(oData.results.length + "");
                        oJSONDataModel.setData(oData);
                        me.getView().setModel(oJSONDataModel, "TableData");
                        me.setTableData();
                        // me.setChangeStatus(false);
                    },
                    error: function (err) { }
                });
            },

            setTableData: function () {
                var me = this;

                //the selected dynamic columns
                var oColumnsModel = this.getView().getModel("Columns");
                var oDataModel = this.getView().getModel("TableData");

                //the selected styles data
                var oColumnsData = oColumnsModel.getProperty('/results');
                var oData = oDataModel.getProperty('/results');
                console.log(oDataModel)
                //set the column and data model
                var oModel = new JSONModel();
                oModel.setData({
                    columns: oColumnsData,
                    rows: oData
                });

                var oTable = this.getView().byId("mainTable");
                oTable.setModel(oModel);

                //bind the dynamic column to the table
                oTable.bindColumns("/columns", function (index, context) {
                    var sColumnId = context.getObject().ColumnName;
                    var sColumnLabel = context.getObject().ColumnLabel;
                    var sColumnType = context.getObject().ColumnType;
                    var sColumnVisible = context.getObject().Visible;
                    var sColumnSorted = context.getObject().Sorted;
                    var sColumnSortOrder = context.getObject().SortOrder;
                    // var sColumnToolTip = context.getObject().Tooltip;
                    //alert(sColumnId.);
                    return new sap.ui.table.Column({
                        id: sColumnId,
                        label: sColumnLabel,
                        template: me.columnTemplate(sColumnId, sColumnType),
                        width: me.getColumnSize(sColumnId, sColumnType),
                        sortProperty: sColumnId,
                        filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" )
                    });
                });

                //bind the data to the table
                oTable.bindRows("/rows");
            },

            columnTemplate: function (sColumnId, sColumnType) {
                var oColumnTemplate;

                oColumnTemplate = new sap.m.Text({ text: "{" + sColumnId + "}" }); //default text

                // //different component based on field
                // if (sColumnId === "STATUSCD") { //display infolabel for Status Code
                //     oColumnTemplate = new sap.tnt.InfoLabel({
                //         text: "{" + sColumnId + "}",
                //         colorScheme: "{= ${" + sColumnId + "} === 'CMP' ? 8 : ${" + sColumnId + "} === 'CRT' ? 3 : 1}"
                //     })
                // } else if (sColumnType === "SEL") { //Manage button
                //     oColumnTemplate = new sap.m.Button({
                //         text: "",
                //         icon: "sap-icon://detail-view",
                //         type: "Ghost",
                //         press: this.goToDetail,
                //         tooltip: "Manage this style"
                //     });
                //     oColumnTemplate.data("StyleNo", "{}"); //custom data to hold style number
                // } else if (sColumnType === "COPY") { //Copy button
                //     oColumnTemplate = new sap.m.Button({
                //         text: "",
                //         icon: "sap-icon://copy",
                //         type: "Ghost",
                //         press: this.onCopyStyle,
                //         tooltip: "Copy this style"
                //     });
                //     oColumnTemplate.data("StyleNo", "{}"); //custom data to hold style number
                // } else {
                //     oColumnTemplate = new sap.m.Text({ text: "{" + sColumnId + "}" }); //default text
                // }

                return oColumnTemplate;
            },

            getColumnSize: function (sColumnId, sColumnType) {
                //column width of fields
                var mSize = '7rem';
                // if (sColumnType === "SEL") {
                //     mSize = '5rem';
                // } else if (sColumnType === "COPY") {
                //     mSize = '4rem';
                // } else if (sColumnId === "STYLECD") {
                //     mSize = '25rem';
                // } else if (sColumnId === "DESC1" || sColumnId === "PRODTYP") {
                //     mSize = '15rem';
                // }
                return mSize;
            },

        });
    });
