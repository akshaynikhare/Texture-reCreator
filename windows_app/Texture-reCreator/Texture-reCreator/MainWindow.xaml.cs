using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using Microsoft.Win32;

namespace Texture_reCreator
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        private void MenuItem_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Multiselect = true;
            openFileDialog.Filter = "Image files (*.jpg, *.jpeg, *.jpe, *.jfif, *.png) | *.jpg; *.jpeg; *.jpe; *.jfif; *.png";
            openFileDialog.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            if (openFileDialog.ShowDialog() == true)
            {
                foreach (string filename in openFileDialog.FileNames)
                    filelist.Items.Add(filename);
            }
        }

        private void Filelist_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if(filelist.SelectedIndex > -1)
            {
               BitmapImage imm=  new BitmapImage(new Uri(filelist.SelectedItem.ToString()));
                preview.Source = imm;
                h.Text=imm.Height.ToString();
                w.Text=imm.Width.ToString();
            }
        }

        private void Slider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {

            var st = (ScaleTransform)preview.RenderTransform;
            double zoom = slider.Value;
            st.ScaleX += zoom;
            st.ScaleY += zoom;
        }
    }
}
