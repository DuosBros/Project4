import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Line } from 'recharts';
import { CHART_COLORS } from '../appConfig';

const GenericBarChart = (props) => {
    return (
        <ResponsiveContainer minHeight={230} minWidth={400} >
            <ComposedChart data={props.data} margin={{ top: 5, right: 50, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={props.xDataKey ? props.xDataKey : "name"} />
                <YAxis dataKey={props.yDataKey ? props.yDataKey : "count"} />
                <Tooltip />
                <Area type='monotone' dot={true} dataKey={props.yDataKey ? props.yDataKey : "count"} fill={CHART_COLORS[0]} />
                <Line dot={true} dataKey={props.avgDataKey ? props.avgDataKey : "count"} type='monotone' stroke='red' />
            </ComposedChart>
        </ResponsiveContainer >
    );
}

export default GenericBarChart;
