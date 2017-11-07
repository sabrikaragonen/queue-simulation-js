var app = new Vue({
	el: '#app',
	data: {
		nextArrival: 0,
		serverCount: 2,
		maxDeparture: 1000,
		maxTime: 30,
		servers: [],
		EventList: [],
		RecentEvent: { time: 0 },
		queue: [],
		departures: [],
		summary: {}
	},
	methods: {
		clone: function(obj) {
			return(JSON.parse(JSON.stringify(obj)));
		},
		getIAT: function () {
			this.nextArrival = this.nextArrival + Math.random() * 10 + 5;
		},
		getServiceTime: function (server) {
			if(server == 1){
				ServiceTime =  Math.random() * 6 + 14;	
			} else if (server == 2){
				random = Math.random();
				if (random <= .12) { ServiceTime = 5 }
				else if (random <= .47) { ServiceTime = 15 }
				else if (random <= .90) { ServiceTime = 25 }
				else if (random <= .96) { ServiceTime = 35 }
				else if (random <= 1) { ServiceTime = 45 }
			}
			return ServiceTime;
		},
		updateDepartureTime: function (server, queueItem) {
			queueItem.serviceBegin = this.RecentEvent.time;
			queueItem.server = server;
			queueItem.departure = this.RecentEvent.time + this.getServiceTime(server)
			this.servers[server - 1] = queueItem
		},
		getRecentEvent: function () {

			min = this.nextArrival;
			type = "arrival";
			server = null;

			this.servers.forEach(function(item, index) {
				if(item != null && item.departure < min){
					type = "departure";
					min = item.departure;
					server = index + 1;
				}
			})
			
			this.RecentEvent = {time: min, type: type, server: server, queue: null};
		},
		queueToServer: function(server) {
			if(this.queue.length > 0){
				queueItem = this.queue.shift();
				this.updateDepartureTime(server, queueItem);
			}
		},
		processService: function(server) {
			this.departures.push(this.servers[server - 1])
			this.servers[server - 1] = null;

			this.queueToServer(server);
		},
		checkServers: function() {
			count = this.serverCount;
			for(server = 1; server <= count; server++){
				if(this.servers[server - 1] == null ){
					this.queueToServer(server);
					return;
				}
			}
		},
		simulation: function() {
			this.getIAT();
			this.updateDepartureTime(1, {arrival: 0});

			event = this.RecentEvent;
			event.type = "start";
			event.nextArrival = this.clone(this.nextArrival);
			event.servers = this.clone(this.servers);
			event.queue = this.clone(this.queue);
			this.EventList.push(event)

			while(this.departures.length < this.maxDeparture ) {
				this.getRecentEvent();

				switch(this.RecentEvent.type) {
					case "arrival":
						this.queue.push({arrival: this.RecentEvent.time});
						this.getIAT();
						this.checkServers();
						break;

					case "departure":
						this.processService(this.RecentEvent.server);
						break;
				}

				event = this.RecentEvent;
				event.nextArrival = this.clone(this.nextArrival);
				event.servers = this.clone(this.servers);
				event.queue = this.clone(this.queue);
				this.EventList.push(event)
			}

			EventCount = this.EventList.length
			for(i = 1; i < EventCount; i++) {
				this.EventList[i - 1].timeInPeriod = this.EventList[i].time - this.EventList[i - 1].time;
			}
			this.EventList[EventCount - 1].timeInPeriod = 0;

			this.summary.avgTime = [
				{attribute: 'Total Time in System', value:  this.RecentEvent.time.toFixed(2) },
				{attribute: 'Avg Time in System', value: (this.departures.reduce((sum, value) => sum + (value.departure - value.arrival), 0) / this.departures.length).toFixed(2) },
				{attribute: 'Avg Time in Queue', value: (this.departures.reduce((sum, value) => sum + (value.serviceBegin - value.arrival), 0) / this.departures.length).toFixed(2) },
				{attribute: 'Avg Time in Service', value: (this.departures.reduce((sum, value) => sum + (value.departure - value.serviceBegin), 0) / this.departures.length).toFixed(2) },
			];

			this.summary.customers = [
				{attribute: 'Total Departures', value: this.departures.length },
				{attribute: 'Still in Service', value: this.servers.length },
				{attribute: 'Still Waiting in Queue', value: this.queue.length },
				{attribute: '# of Customers Waited in Queue', value: this.departures.reduce((sum, value) => sum + (value.serviceBegin > value.arrival ? 1 : 0), 0)},
                {attribute: 'Probability of Waiting in Queue', value:(this.departures.reduce((sum, value) => sum + (value.serviceBegin > value.arrival ? 1 : 0), 0) / this.departures.length * 100 ).toFixed(2) + ' %' },
                {attribute: 'Avg Customers in System', value: (this.EventList.reduce( (sum, value) => 
                	sum + ((value.queue.length) + (value.servers[0] == null ? 0 : 1) + (value.servers[1] == null ? 0 : 1)) * value.timeInPeriod , 0) / this.RecentEvent.time).toFixed(2) 
            	},
            	{attribute: 'Avg Customers in Queue', value: (this.EventList.reduce( (sum, value) => 
                	sum + (value.queue.length * value.timeInPeriod) , 0) / this.RecentEvent.time).toFixed(2) 
            	}
                
			];

			this.summary.events = []
			for(server = 1; server <= this.serverCount; server++){
				this.summary.events.push({attribute: 'Server '+ server +' Utilization', value: (this.EventList.reduce( (sum, value) => sum + (value.servers[server - 1] == null ? 0 : value.timeInPeriod) , 0) / this.RecentEvent.time * 100).toFixed(2) + ' %' })
			}
				
		}			
	}
})
