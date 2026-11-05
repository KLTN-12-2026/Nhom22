package com.do_an_tot_nghiep.k28.content;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import javax.imageio.ImageIO;

final class FileFixtures {

    static byte[] image(String format) throws Exception {
        var image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0xff0055);
        var output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }

    static byte[] wav(int seconds) {
        int size = seconds * 8000;
        ByteBuffer b = ByteBuffer.allocate(size + 44).order(ByteOrder.LITTLE_ENDIAN);
        b.put("RIFF".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        b.putInt(size + 36);
        b.put("WAVEfmt ".getBytes(java.nio.charset.StandardCharsets.US_ASCII));
        b.putInt(16).putShort((short) 1).putShort((short) 1);
        b.putInt(8000).putInt(8000).putShort((short) 1).putShort((short) 8);
        b.put("data".getBytes(java.nio.charset.StandardCharsets.US_ASCII)).putInt(size);
        while (b.hasRemaining()) {
            b.put((byte) 128);
        }
        return b.array();
    }
}
