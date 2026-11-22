package com.do_an_tot_nghiep.k28.common.realtime;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

@Configuration
public class RealtimeConfig {

    @Bean
    RedisMessageListenerContainer realtimeListenerContainer(RedisConnectionFactory factory, RealtimeHub hub) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(hub, new ChannelTopic(RealtimeRelay.KENH));
        return container;
    }
}
