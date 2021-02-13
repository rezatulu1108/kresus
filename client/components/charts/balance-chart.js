import React from 'react';
import Dygraph from 'dygraphs';

import { round2, getChartsDefaultColors, translate as $t } from '../../helpers';

import ChartComponent from './chart-base';
import DiscoveryMessage from '../ui/discovery-message';

import 'dygraphs/dist/dygraph.css';

function createChartBalance(chartId, initialBalance, transactions, theme) {
    let ops = transactions.slice().sort((a, b) => +a.date - +b.date);

    function makeKey(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    let opmap = new Map();

    // Fill all dates.
    const DAY = 1000 * 60 * 60 * 24;

    let firstDate = ops.length ? +ops[0].date : Date.now();
    firstDate = ((firstDate / DAY) | 0) * DAY;

    let today = ((Date.now() / DAY) | 0) * DAY;
    for (; firstDate <= today; firstDate += DAY) {
        opmap.set(makeKey(new Date(firstDate)), 0);
    }

    // Date (day) -> cumulated sum of amounts for this day (scalar).
    for (let o of ops) {
        let key = makeKey(o.date);
        if (opmap.has(key)) {
            opmap.set(key, opmap.get(key) + o.amount);
        }
    }

    let balance = initialBalance ? initialBalance : 0;
    let csv = 'Date,Balance\n';
    for (let [date, amount] of opmap) {
        balance += amount;
        csv += `${date},${round2(balance)}\n`;
    }

    /* eslint-disable no-new */

    // Create the chart
    let chartsColors = getChartsDefaultColors(theme);

    return new Dygraph(document.getElementById(chartId), csv, {
        color: chartsColors.LINES,

        axisLineColor: chartsColors.AXIS,

        axes: {
            x: {
                axisLabelFormatter: date => {
                    // Undefined means the default locale
                    let defaultLocale;
                    return date.toLocaleDateString(defaultLocale, {
                        year: '2-digit',
                        month: 'short',
                    });
                },
            },
        },

        fillGraph: true,

        showRangeSelector: true,

        rangeSelectorPlotFillGradientColor: chartsColors.LINES,

        rangeSelectorPlotStrokeColor: chartsColors.LINES,

        // 6 months (180 days) window
        dateWindow: [today - DAY * 180, today],

        // 4px dashes separated by a 2px blank space
        gridLinePattern: [4, 2],
    });

    /* eslint-enable no-new */
}

export default class BalanceChart extends ChartComponent {
    redraw() {
        this.container = createChartBalance(
            'barchart',
            this.props.initialBalance,
            this.props.transactions,
            this.props.theme
        );
    }

    render() {
        return (
            <React.Fragment>
                <DiscoveryMessage message={$t('client.charts.balance_desc')} />
                <div id="barchart" style={{ width: '100%' }} />
            </React.Fragment>
        );
    }
}
