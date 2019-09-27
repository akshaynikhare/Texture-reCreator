using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using Cyotek.Windows.Forms;

namespace ImageBoxSample
{
  // ImageBox sample project
  // http://cyotek.com/article/display/creating-a-scrollable-and-zoomable-image-viewer-in-csharp-part-2
  // Preview image based on bwpx.icns - http://paularmstrongdesigns.com/projects/bwpx-icns/
  // Large preview image from http://www.crazythemes.com/colorful-abstract-widescreen-wallpapers-vol2/2153
  // Zone and Magnifier-Zoom icons from Fugue Icons - http://p.yusukekamiyamane.com/

  public partial class MainForm : Form
  {
    #region  Public Constructors

    public MainForm()
    {
      InitializeComponent();

      this.UpdateStatusBar();
    }

    #endregion  Public Constructors

    #region  Event Handlers

    private void imageBox_Paint(object sender, PaintEventArgs e)
    {
      // highlight the image
      if (showImageRegionToolStripButton.Checked)
        this.DrawBox(e.Graphics, Color.CornflowerBlue, ((ImageBox)sender).GetImageViewPort());

      // show the region that will be drawn from the source image
      if (showSourceImageRegionToolStripButton.Checked)
        this.DrawBox(e.Graphics, Color.Firebrick, new Rectangle(((ImageBox)sender).GetImageViewPort().Location, ((ImageBox)sender).GetSourceImageRegion().Size));
    }

    private void imageBox_Scroll(object sender, ScrollEventArgs e)
    {
      this.UpdateStatusBar();
    }

    private void showImageRegionToolStripButton_Click(object sender, EventArgs e)
    {
      imageBox.Invalidate();
    }

    #endregion  Event Handlers

    #region  Private Methods

    private void DrawBox(Graphics graphics, Color color, Rectangle rectangle)
    {
      int offset;
      int penWidth;

      offset = 9;
      penWidth = 2;

      using (SolidBrush brush = new SolidBrush(Color.FromArgb(64, color)))
        graphics.FillRectangle(brush, rectangle);

      using (Pen pen = new Pen(color, penWidth))
      {
        pen.DashStyle = DashStyle.Dot;
        graphics.DrawLine(pen, rectangle.Left, rectangle.Top - offset, rectangle.Left, rectangle.Bottom + offset);
        graphics.DrawLine(pen, rectangle.Left + rectangle.Width, rectangle.Top - offset, rectangle.Left + rectangle.Width, rectangle.Bottom + offset);
        graphics.DrawLine(pen, rectangle.Left - offset, rectangle.Top, rectangle.Right + offset, rectangle.Top);
        graphics.DrawLine(pen, rectangle.Left - offset, rectangle.Bottom, rectangle.Right + offset, rectangle.Bottom);
      }
    }

    #endregion  Private Methods

    private void UpdateStatusBar()
    {
      positionToolStripStatusLabel.Text = imageBox.AutoScrollPosition.ToString();
      imageSizeToolStripStatusLabel.Text = imageBox.GetImageViewPort().ToString();
      zoomToolStripStatusLabel.Text = string.Format("{0}%", imageBox.Zoom);
    }

    private void imageBox_ZoomChanged(object sender, EventArgs e)
    {
      this.UpdateStatusBar();
    }

    private void imageBox_Resize(object sender, EventArgs e)
    {
      this.UpdateStatusBar();
    }
  }
}
