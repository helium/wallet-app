package com.helium.wallet.app;

import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.ReactCookieJarContainer;
import okhttp3.OkHttpClient;

public class UserAgentClientFactory implements OkHttpClientFactory {
    private final String userAgent;

    public UserAgentClientFactory(String userAgent) {
        this.userAgent = userAgent;
    }

    public OkHttpClient createNewNetworkModuleClient() {
        return new OkHttpClient.Builder()
                .cookieJar(new ReactCookieJarContainer())
                .addInterceptor(new UserAgentInterceptor(userAgent))
                .build();
    }
}
