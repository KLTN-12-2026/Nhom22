package com.do_an_tot_nghiep.k28.ai.client;

import com.do_an_tot_nghiep.k28.common.job.JobException;
import com.do_an_tot_nghiep.k28.common.job.JobException.Kieu;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Random;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.ai.image.provider", havingValue = "fake", matchIfMissing = true)
public class FakeImageClient implements ImageClient {

    public static final String MODEL = "fake-card-image";
    private static final int SIZE = 256;

    @Override
    public String nhaCungCap() {
        return "fake";
    }

    @Override
    public ImageResult taoAnh(String prompt) {
        if (prompt.contains("#mo-phong:LOI")) {
            throw new JobException(Kieu.LOI, "MO_PHONG_LOI");
        }
        if (prompt.contains("#mo-phong:TIMEOUT")) {
            throw new JobException(Kieu.KHONG_XAC_DINH, "TIMEOUT");
        }
        Random random = new Random(prompt.hashCode());
        BufferedImage image = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(new Color(245, 241, 230));
            g.fillRect(0, 0, SIZE, SIZE);
            for (int i = 0; i < 6; i++) {
                g.setColor(new Color(random.nextInt(200), random.nextInt(200), random.nextInt(200)));
                int d = 40 + random.nextInt(90);
                g.fillOval(random.nextInt(SIZE - d), random.nextInt(SIZE - d), d, d);
            }
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "png", out);
        } catch (IOException e) {
            throw new JobException(Kieu.LOI, "MO_PHONG_LOI");
        }
        return new ImageResult(out.toByteArray(), MODEL, "fake-" + UUID.randomUUID());
    }
}
